package com.fwb.restaurant.service;

import com.fwb.restaurant.dto.req.booking.BookingRequest;
import com.fwb.restaurant.dto.req.booking.BookingRatingRequest;
import com.fwb.restaurant.dto.res.BookingResponse;
import com.fwb.restaurant.dto.res.BookingResponse.Dish;
import com.fwb.restaurant.dto.res.BranchResponse;
import com.fwb.restaurant.dto.res.FoodResponse;
import com.fwb.restaurant.dto.res.PromotionResponse;
import com.fwb.restaurant.dto.res.TableAvailabilityResponse;
import com.fwb.restaurant.dto.res.TableResponse;
import com.fwb.restaurant.dto.res.UserResponse;
import com.fwb.restaurant.entity.Booking;
import com.fwb.restaurant.entity.BookingDish;
import com.fwb.restaurant.entity.Branch;
import com.fwb.restaurant.entity.Food;
import com.fwb.restaurant.entity.FoodRating;
import com.fwb.restaurant.entity.Promotion;
import com.fwb.restaurant.entity.RestaurantTable;
import com.fwb.restaurant.entity.User;
import com.fwb.restaurant.repository.BookingRepository;
import com.fwb.restaurant.repository.BranchRepository;
import com.fwb.restaurant.repository.FoodRepository;
import com.fwb.restaurant.repository.FoodRatingRepository;
import com.fwb.restaurant.repository.RestaurantTableRepository;
import com.fwb.restaurant.repository.UserRepository;
import com.fwb.restaurant.utils.SecurityUtils;
import com.fwb.restaurant.utils.enums.BookingStatus;
import com.fwb.restaurant.utils.error.AppException;
import com.fwb.restaurant.utils.error.ConflictException;
import com.fwb.restaurant.utils.error.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.*;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final RestaurantTableRepository tableRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final FoodRepository foodRepository;
    private final FoodRatingRepository foodRatingRepository;
    private final PromotionService promotionService;
    private final NotificationService notificationService;
    private static final Set<BookingStatus> ACTIVE_STATUSES =
            Set.of(BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN);
    private static final Set<BookingStatus> LIST_STATUSES = EnumSet.allOf(BookingStatus.class);
    private static final String ROLE_ADMIN = "ADMIN";
    private static final String ROLE_STAFF = "STAFF";
    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Transactional
    public BookingResponse create(BookingRequest request) {
        RestaurantTable table = tableRepository.findById(request.getTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bàn..."));

        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh..."));

        if (!table.getBranch().getId().equals(branch.getId())) {
            throw new ConflictException("Bàn không thuộc chi nhánh đã chọn...");
        }

        if (request.getBookingTime().isBefore(LocalDateTime.now(DEFAULT_ZONE).plusHours(1))) {
            throw new AppException("Vui lòng đặt bàn trước ít nhất 1 giờ");
        }

        User user = getCurrentUser();

        LocalDateTime reservedFrom = request.getBookingTime();
        LocalDateTime reservedTo = reservedFrom.plusMinutes(request.getDurationMinutes());

        boolean blocked = bookingRepository.existsOverlap(
                table.getId(),
                ACTIVE_STATUSES,
                reservedFrom,
                reservedTo
        );

        if (blocked) {
            throw new ConflictException("Bàn đã được đặt trong khung giờ này");
        }

        if (request.getGuests() > table.getCapacity()) {
            throw new ConflictException(String.format(
                    "Bàn %s chỉ phục vụ tối đa %d khách",
                    table.getTableCode(),
                    table.getCapacity()
            ));
        }

        Booking booking = new Booking();
        booking.setReservedFrom(reservedFrom);
        booking.setReservedTo(reservedTo);
        booking.setGuests(request.getGuests());
        booking.setSpecialRequest(request.getSpecialRequest());
        booking.setBranch(branch);
        booking.setTable(table);
        booking.setUser(user);
        booking.setStatus(BookingStatus.CONFIRMED);

        boolean isVip = table.getTableCode().toUpperCase().startsWith("VIP");
        BigDecimal deposit = isVip ? new BigDecimal("300000") : new BigDecimal("200000");
        booking.setDepositAmount(deposit);

        if (request.getDishes() != null && !request.getDishes().isEmpty()) {
            request.getDishes().forEach(d -> {
                Food food = foodRepository.findById(d.getFoodId())
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn"));
                BookingDish dish = new BookingDish();
                dish.setBooking(booking);
                dish.setFood(food);
                dish.setQuantity(d.getQuantity());
                dish.setUnitPrice(food.getPrice());
                dish.setServingOrder(d.getServingOrder() != null ? d.getServingOrder() : 0);
                dish.setSpecialNote(d.getSpecialNote());
                booking.getDishes().add(dish);
            });
        }

        BigDecimal subtotal = calculateSubtotal(booking);
        if (StringUtils.hasText(request.getPromotionCode())) {
            PromotionService.PromotionDiscount promotionDiscount =
                    promotionService.reservePromotion(request.getPromotionCode(), subtotal);
            booking.setPromotion(promotionDiscount.promotion());
            booking.setDiscountAmount(promotionDiscount.discountAmount());
        } else {
            booking.setPromotion(null);
            booking.setDiscountAmount(BigDecimal.ZERO);
        }

        applyAmounts(booking, subtotal);

        Booking saved = bookingRepository.save(booking);
        // Do NOT send notification here. It will be sent via paySuccess endpoint after successful payment.
        return toResponse(saved);
    }

    @Transactional
    public BookingResponse cancel(String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy booking"));
        User currentUser = getCurrentUser();
        if (isStaff(currentUser)) {
            ensureStaffCanManageBooking(currentUser, booking);
        } else if (isAdmin(currentUser)) {
            // allowed
        } else if (!booking.getUser().getId().equals(currentUser.getId())) {
            throw new ConflictException("Bạn chỉ có thể huỷ booking của chính mình");
        }
        
        if (booking.getStatus() == BookingStatus.CHECKED_IN) {
            throw new ConflictException("Không thể hủy bàn sau khi khách đã check-in");
        }
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new ConflictException("Chỉ có thể huỷ booking ở trạng thái xác nhận");
        }

        // Kiểm tra điều kiện hoàn tiền cọc trước 2 giờ sát giờ đặt bàn
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime reservedTime = booking.getReservedFrom();
        if (now.isBefore(reservedTime.minusHours(2))) {
            booking.setDepositRefunded(true);
        } else {
            booking.setDepositRefunded(false);
        }

        booking.setStatus(BookingStatus.CANCELLED);

        // Giải phóng bàn về trạng thái AVAILABLE khi hủy booking để đảm bảo đồng bộ hoàn hảo với sơ đồ bàn trên Web Dashboard
        RestaurantTable table = booking.getTable();
        if (table != null) {
            table.setStatus(com.fwb.restaurant.utils.enums.TableStatus.AVAILABLE);
            tableRepository.save(table);
        }

        Booking saved = bookingRepository.save(booking);
        this.notificationService.sendBookingCancelled(saved);
        return toResponse(saved);
    }

    @Transactional
    public BookingResponse complete(String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy booking"));
        User currentUser = getCurrentUser();
        if (isStaff(currentUser)) {
            ensureStaffCanManageBooking(currentUser, booking);
        } else if (!isAdmin(currentUser)) {
            throw new ConflictException("Bạn không có quyền hoàn thành booking này");
        }
        if (!(booking.getStatus() == BookingStatus.CONFIRMED || booking.getStatus() == BookingStatus.CHECKED_IN)) {
            throw new ConflictException("Chỉ có thể hoàn thành booking đang hoạt động");
        }

        Set<Food> foodsToUpdate = new HashSet<>();
        booking.getDishes().forEach(dish -> {
            Food food = dish.getFood();
            if (food != null) {
                food.setSold(food.getSold() + dish.getQuantity());
                foodsToUpdate.add(food);
            }
        });

        if (!foodsToUpdate.isEmpty()) {
            foodRepository.saveAll(foodsToUpdate);
        }

        booking.setStatus(BookingStatus.COMPLETED);

        // release table status
        RestaurantTable table = booking.getTable();
        if (table != null) {
            table.setStatus(com.fwb.restaurant.utils.enums.TableStatus.AVAILABLE);
            tableRepository.save(table);
        }

        Booking saved = bookingRepository.save(booking);
        return toResponse(saved);
    }

    @Transactional
    public BookingResponse checkIn(String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy booking"));
        User currentUser = getCurrentUser();
        if (isStaff(currentUser)) {
            ensureStaffCanManageBooking(currentUser, booking);
        } else if (!isAdmin(currentUser)) {
            throw new ConflictException("Bạn không có quyền check-in booking này");
        }
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new ConflictException("Chỉ có thể check-in booking ở trạng thái CONFIRMED");
        }
        booking.setStatus(BookingStatus.CHECKED_IN);

        // lock table status
        RestaurantTable table = booking.getTable();
        if (table != null) {
            table.setStatus(com.fwb.restaurant.utils.enums.TableStatus.UNAVAILABLE);
            tableRepository.save(table);
        }

        Booking saved = bookingRepository.save(booking);
        return toResponse(saved);
    }

    @Transactional
    public BookingResponse paySuccess(String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy booking"));
        
        // Gửi thông báo đặt bàn thành công sau khi đã thanh toán thành công
        this.notificationService.sendBookingSuccess(booking);
        
        return toResponse(booking);
    }

    @Transactional
    public void delete(String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy booking"));
        
        // Giải phóng bàn ăn về trạng thái AVAILABLE
        RestaurantTable table = booking.getTable();
        if (table != null) {
            table.setStatus(com.fwb.restaurant.utils.enums.TableStatus.AVAILABLE);
            tableRepository.save(table);
        }
        
        bookingRepository.delete(booking);
    }

    public List<TableAvailabilityResponse> getAvailability(String branchId, LocalDateTime start, int guests, int durationMinutes) {
        LocalDateTime end = start.plusMinutes(durationMinutes);
        branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh"));

        int requiredGuests = Math.max(guests, 1);
        List<RestaurantTable> tables = tableRepository.findByBranchIdAndCapacityGreaterThanEqual(branchId, requiredGuests);
        List<Booking> bookings = bookingRepository.findOverlapsByBranch(
                branchId,
                ACTIVE_STATUSES,
                start,
                end
        );

        Map<String, Booking> bookingMap = bookings.stream()
                .collect(Collectors.toMap(b -> b.getTable().getId(), b -> b, (b1, b2) -> b1));

        return tables.stream()
                .map(table -> {
                    Booking booking = bookingMap.get(table.getId());
                    return TableAvailabilityResponse.builder()
                            .tableId(table.getId())
                            .tableCode(table.getTableCode())
                            .capacity(table.getCapacity())
                            .status(table.getStatus())
                            .booked(booking != null)
                            .reservedFrom(toOffsetDateTime(booking != null ? booking.getReservedFrom() : null))
                            .reservedTo(toOffsetDateTime(booking != null ? booking.getReservedTo() : null))
                            .build();
                })
                .toList();
    }

    public List<BookingResponse> getBookings(String branchId, LocalDate date, String month) {
        LocalDateTime start;
        LocalDateTime end;

        if (month != null && !month.isEmpty()) {
            // month is in YYYY-MM format
            String[] parts = month.split("-");
            int year = Integer.parseInt(parts[0]);
            int m = Integer.parseInt(parts[1]);
            start = LocalDate.of(year, m, 1).atStartOfDay();
            end = start.plusMonths(1);
        } else {
            LocalDate targetDate = date != null ? date : LocalDate.now();
            start = targetDate.atStartOfDay();
            end = start.plusDays(1);
        }

        User currentUser = getCurrentUser();
        String effectiveBranchId = branchId;
        if (isStaff(currentUser)) {
            effectiveBranchId = requireManagedBranch(currentUser).getId();
        } else if (effectiveBranchId != null) {
            branchRepository.findById(effectiveBranchId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh"));
        }

        return bookingRepository.findByBranchAndTimeRange(effectiveBranchId, LIST_STATUSES, start, end)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<BookingResponse> getMyBookings() {
        User user = getCurrentUser();

        return bookingRepository.findByUserIdOrderByReservedFromDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<Booking> findReservationsToRemind(BookingStatus bookingStatus, LocalDateTime from, LocalDateTime to) {
        return this.bookingRepository.findReservationsToRemind(bookingStatus, from, to);
    }

    public void setReminderBooking(Booking booking) {
        booking.setReminder(true);
        this.bookingRepository.save(booking);
    }

    @Transactional
    public void rateFoodsInBooking(String bookingId, BookingRatingRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy booking"));

        User currentUser = getCurrentUser();
        if (!booking.getUser().getId().equals(currentUser.getId())) {
            throw new ConflictException("Bạn chỉ có thể đánh giá booking của chính mình");
        }

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new ConflictException("Chỉ có thể đánh giá sau khi booking đã hoàn thành");
        }

        Map<String, Food> uniqueFoods = booking.getDishes().stream()
                .map(BookingDish::getFood)
                .filter(food -> food != null)
                .collect(Collectors.toMap(Food::getId, f -> f, (f1, f2) -> f1));

        if (uniqueFoods.isEmpty()) {
            return;
        }

        int ratingValue = request.getRating();
        String comment = request.getComment();

        List<FoodRating> ratings = uniqueFoods.values().stream().map(food -> {
            FoodRating rating = new FoodRating();
            rating.setFood(food);
            rating.setUser(currentUser);
            rating.setBooking(booking);
            rating.setRating(ratingValue);
            rating.setComment(comment);
            // cập nhật thống kê rating cho từng món
            long count = food.getRatingCount() != null ? food.getRatingCount() : 0L;
            double avg = food.getAvgRating() != null ? food.getAvgRating() : 0.0;
            double newAvg = (avg * count + ratingValue) / (count + 1);
            food.setRatingCount(count + 1);
            food.setAvgRating(newAvg);
            return rating;
        }).toList();

        foodRatingRepository.saveAll(ratings);
        foodRepository.saveAll(uniqueFoods.values());
    }

    private BookingResponse toResponse(Booking booking) {
        TableResponse tableResponse = TableResponse.builder()
                .id(booking.getTable().getId())
                .tableCode(booking.getTable().getTableCode())
                .capacity(booking.getTable().getCapacity())
                .location(booking.getTable().getLocation())
                .status(booking.getTable().getStatus())
                .build();

        BranchResponse branchResponse = new BranchResponse();
        branchResponse.setId(booking.getBranch().getId());
        branchResponse.setName(booking.getBranch().getName());
        branchResponse.setAddress(booking.getBranch().getAddress());
        branchResponse.setPhone(booking.getBranch().getPhone());
        branchResponse.setImageUrl(booking.getBranch().getImageUrl());
        branchResponse.setOpenTime(booking.getBranch().getOpenTime());
        branchResponse.setCloseTime(booking.getBranch().getCloseTime());

        UserResponse userResponse = new UserResponse();
        userResponse.setId(booking.getUser().getId());
        userResponse.setEmail(booking.getUser().getEmail());
        userResponse.setUsername(booking.getUser().getUsername());
        userResponse.setPhone(booking.getUser().getPhone());
        if (booking.getUser().getBranch() != null) {
            userResponse.setBranchId(booking.getUser().getBranch().getId());
            userResponse.setBranchName(booking.getUser().getBranch().getName());
        }

        List<Dish> dishes = booking.getDishes().stream()
                .map(dish -> Dish.builder()
                        .id(dish.getId())
                        .quantity(dish.getQuantity())
                        .unitPrice(dish.getUnitPrice())
                        .servingOrder(dish.getServingOrder())
                        .specialNote(dish.getSpecialNote())
                        .food(FoodResponse.builder()
                                .id(dish.getFood().getId())
                                .name(dish.getFood().getName())
                                .description(dish.getFood().getDescription())
                                .thumbUrl(dish.getFood().getThumbUrl())
                                .price(dish.getUnitPrice())
                                .sold(dish.getFood().getSold())
                                .build())
                        .build())
                .toList();

        PromotionResponse promotionResponse = null;
        if (booking.getPromotion() != null) {
            promotionResponse = toPromotionResponse(booking.getPromotion());
        }

        return BookingResponse.builder()
                .id(booking.getId())
                .reservedFrom(toOffsetDateTime(booking.getReservedFrom()))
                .reservedTo(toOffsetDateTime(booking.getReservedTo()))
                .guests(booking.getGuests())
                .status(booking.getStatus())
                .specialRequest(booking.getSpecialRequest())
                .subtotalAmount(booking.getSubtotalAmount())
                .discountAmount(booking.getDiscountAmount())
                .totalAmount(booking.getTotalAmount())
                .depositAmount(booking.getDepositAmount())
                .depositRefunded(booking.getDepositRefunded())
                .promotion(promotionResponse)
                .table(tableResponse)
                .branch(branchResponse)
                .user(userResponse)
                .dishes(dishes)
                .rated(foodRatingRepository.existsByBookingId(booking.getId()))
                .build();
    }

    @Transactional
    public BookingResponse updateDishes(String id, List<BookingRequest.DishRequest> dishRequests) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy booking"));

        User currentUser = getCurrentUser();
        if (isStaff(currentUser)) {
            ensureStaffCanManageBooking(currentUser, booking);
        } else if (isAdmin(currentUser)) {
            // allowed
        } else if (!booking.getUser().getId().equals(currentUser.getId())) {
            throw new ConflictException("Bạn chỉ có thể cập nhật booking của chính mình");
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED && booking.getStatus() != BookingStatus.CHECKED_IN) {
            throw new ConflictException("Chỉ có thể cập nhật món ăn khi booking đang hoạt động");
        }

        booking.getDishes().clear();

        if (dishRequests != null && !dishRequests.isEmpty()) {
            dishRequests.forEach(d -> {
                Food food = foodRepository.findById(d.getFoodId())
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn"));
                BookingDish dish = new BookingDish();
                dish.setBooking(booking);
                dish.setFood(food);
                dish.setQuantity(d.getQuantity());
                dish.setUnitPrice(food.getPrice());
                dish.setServingOrder(d.getServingOrder() != null ? d.getServingOrder() : 0);
                dish.setSpecialNote(d.getSpecialNote());
                booking.getDishes().add(dish);
            });
        }

        BigDecimal subtotal = calculateSubtotal(booking);
        if (booking.getPromotion() != null) {
            Promotion promotion = booking.getPromotion();
            BigDecimal discount = subtotal.multiply(BigDecimal.valueOf(promotion.getDiscountPercent()))
                    .divide(BigDecimal.valueOf(100), 0, java.math.RoundingMode.HALF_UP);
            booking.setDiscountAmount(discount);
        } else {
            booking.setDiscountAmount(BigDecimal.ZERO);
        }

        applyAmounts(booking, subtotal);

        Booking saved = bookingRepository.save(booking);
        return toResponse(saved);
    }

    private OffsetDateTime toOffsetDateTime(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.atZone(DEFAULT_ZONE).toOffsetDateTime() : null;
    }

    private void applyAmounts(Booking booking, BigDecimal subtotal) {
        BigDecimal discount = booking.getDiscountAmount() != null
                ? booking.getDiscountAmount()
                : BigDecimal.ZERO;

        BigDecimal total = subtotal.subtract(discount);
        if (total.compareTo(BigDecimal.ZERO) < 0) {
            total = BigDecimal.ZERO;
        }

        booking.setSubtotalAmount(subtotal);
        booking.setDiscountAmount(discount);
        booking.setTotalAmount(total);
    }

    private BigDecimal calculateSubtotal(Booking booking) {
        return booking.getDishes().stream()
                .map(dish -> BigDecimal.valueOf(dish.getUnitPrice())
                        .multiply(BigDecimal.valueOf(dish.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private PromotionResponse toPromotionResponse(Promotion promotion) {
        return PromotionResponse.builder()
                .id(promotion.getId())
                .code(promotion.getCode())
                .name(promotion.getName())
                .description(promotion.getDescription())
                .discountPercent(promotion.getDiscountPercent())
                .quantity(promotion.getQuantity())
                .remaining(promotion.getRemaining())
                .active(promotion.isActive())
                .startDate(promotion.getStartDate())
                .endDate(promotion.getEndDate())
                .build();
    }

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new ResourceNotFoundException("Vui lòng đăng nhập..."));
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
    }

    private boolean isStaff(User user) {
        return user.getRole() != null && ROLE_STAFF.equalsIgnoreCase(user.getRole().getName());
    }

    private boolean isAdmin(User user) {
        return user.getRole() != null && ROLE_ADMIN.equalsIgnoreCase(user.getRole().getName());
    }

    private Branch requireManagedBranch(User user) {
        if (user.getBranch() == null) {
            throw new ConflictException("Nhân viên chưa được gán chi nhánh");
        }
        return user.getBranch();
    }

    private void ensureStaffCanManageBooking(User user, Booking booking) {
        Branch managedBranch = requireManagedBranch(user);
        if (!booking.getBranch().getId().equals(managedBranch.getId())) {
            throw new ConflictException("Bạn không thể thao tác booking của chi nhánh khác");
        }
    }
}

