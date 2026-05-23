package com.fwb.restaurant.service;

import com.fwb.restaurant.dto.res.NotificationResponse;
import com.fwb.restaurant.dto.res.PaginationResponse;
import com.fwb.restaurant.dto.res.UserResponse;
import com.fwb.restaurant.entity.Booking;
import com.fwb.restaurant.entity.Notification;
import com.fwb.restaurant.entity.Promotion;
import com.fwb.restaurant.mapper.NotificationMapper;
import com.fwb.restaurant.repository.NotificationRepository;
import com.fwb.restaurant.utils.SecurityUtils;
import com.fwb.restaurant.utils.enums.NotificationScope;
import com.fwb.restaurant.utils.enums.NotificationType;
import com.fwb.restaurant.utils.error.AppException;
import com.fwb.restaurant.utils.error.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserService userService;

    public Notification save(Notification notification) {
        return this.notificationRepository.save(notification);
    }

    public PaginationResponse getGlobalNotifications(Pageable pageable) {
        Page<Notification> notifications =
                this.notificationRepository.findByScopeOrderByCreatedAtDesc(
                        NotificationScope.GLOBAL,
                        pageable
                );
        return this.buildPaginationResponse(notifications);
    }

    public PaginationResponse getMyNotifications(Pageable pageable) {
        Page<Notification> notifications =
                this.notificationRepository.findAllMyAndGlobalNotifications(
                        NotificationScope.GLOBAL,
                        NotificationScope.USER_ONLY,
                        getUserId(),
                        pageable
                );
        return this.buildPaginationResponse(notifications);
    }

    public void markAllRead() {
        String userId = getUserId();
        List<Notification> unreadNotifs = this.notificationRepository.findByScopeAndUser_IdAndReadFalse(
                NotificationScope.USER_ONLY,
                userId
        );
        for (Notification notif : unreadNotifs) {
            notif.setRead(true);
        }
        this.notificationRepository.saveAll(unreadNotifs);
    }

    private String getUserId() {
        String email = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new ResourceNotFoundException("Vui lòng đăng nhập!!!"));
        UserResponse user = this.userService.getByEmail(email);
        return user.getId();
    }

    private PaginationResponse buildPaginationResponse(Page<Notification> page) {
        PaginationResponse.Meta meta = PaginationResponse.Meta.builder()
                .page(page.getNumber() + 1)
                .pages(page.getTotalPages())
                .pageSize(page.getSize())
                .total(page.getTotalElements())
                .build();

        List<NotificationResponse> responses = page.getContent().stream()
                .map(notificationMapper::toResponse)
                .toList();

        return PaginationResponse.builder()
                .meta(meta)
                .result(responses)
                .build();
    }

    public void sendNewPromotionNotification(Promotion promotion) {
        Notification payload = Notification.builder()
                .type(NotificationType.PROMOTION)
                .scope(NotificationScope.GLOBAL)
                .title("Ưu đãi mới: " + promotion.getName())
                .message(promotion.getDescription())
                .image(promotion.getImageUrl())
                .createdAt(Instant.now())
                .build();
        payload = this.save(payload);

        messagingTemplate.convertAndSend(
                "/topic/notifications",
                notificationMapper.toResponse(payload)
        );
    }

    public void sendBookingReminder(Booking booking) {
        Notification payload = Notification.builder()
                .type(NotificationType.BOOKING_REMINDER)
                .scope(NotificationScope.USER_ONLY)
                .user(booking.getUser())
                .title("Nhắc lịch đặt bàn")
                .message("Bàn của bạn tại " + booking.getBranch().getName()
                        + " sẽ đến giờ lúc " + booking.getReservedFrom() + ".")
                .createdAt(Instant.now())
                .build();
        payload = this.save(payload);

        String userEmail = booking.getUser().getEmail();

        messagingTemplate.convertAndSendToUser(
                userEmail,
                "/queue/notifications",
                notificationMapper.toResponse(payload)
        );
    }

    private String formatTableCode(String tableCode) {
        if (tableCode == null || tableCode.isEmpty()) return "";
        String[] parts = tableCode.split("-");
        if (parts.length >= 4) {
            boolean isVip = parts[0].equalsIgnoreCase("VIP");
            String capacity = parts[2];
            String index = parts[3];
            return isVip ? "Bàn VIP " + capacity + "-" + index : "Bàn Thường " + capacity + "-" + index;
        }
        if (tableCode.toUpperCase().startsWith("VIP-")) {
            return "Bàn VIP " + tableCode.substring(4);
        }
        if (tableCode.toUpperCase().startsWith("STD-")) {
            return "Bàn Thường " + tableCode.substring(4);
        }
        return tableCode;
    }

    public void sendBookingSuccess(Booking booking) {
        String formattedTable = formatTableCode(booking.getTable().getTableCode());
        Notification payload = Notification.builder()
                .type(NotificationType.BOOKING_REMINDER)
                .scope(NotificationScope.USER_ONLY)
                .user(booking.getUser())
                .title("Đặt bàn thành công")
                .message("Đặt bàn thành công! " + formattedTable
                        + " tại " + booking.getBranch().getName() + " lúc " + booking.getReservedFrom().toString().replace("T", " ") + " đã được xác nhận.")
                .createdAt(Instant.now())
                .build();
        payload = this.save(payload);

        try {
            messagingTemplate.convertAndSendToUser(
                    booking.getUser().getEmail(),
                    "/queue/notifications",
                    notificationMapper.toResponse(payload)
            );
        } catch (Exception e) {}
    }

    public void sendBookingCancelled(Booking booking) {
        String formattedTable = formatTableCode(booking.getTable().getTableCode());
        
        java.text.DecimalFormat df = new java.text.DecimalFormat("#,###");
        String formattedDeposit = booking.getDepositAmount() != null ? df.format(booking.getDepositAmount()) : "0";
        String refundMsg = Boolean.TRUE.equals(booking.getDepositRefunded())
                ? " Bạn đã hủy trước 2 giờ nên sẽ được hoàn lại toàn bộ tiền cọc (" + formattedDeposit + "đ) vào tài khoản thanh toán."
                : " Do bạn hủy sau 2 giờ sát giờ đặt bàn, tiền cọc (" + formattedDeposit + "đ) sẽ không được hoàn lại theo quy định.";

        Notification payload = Notification.builder()
                .type(NotificationType.BOOKING_REMINDER)
                .scope(NotificationScope.USER_ONLY)
                .user(booking.getUser())
                .title("Hủy bàn thành công")
                .message("Đã hủy bàn thành công! Yêu cầu đặt bàn " + formattedTable
                        + " tại " + booking.getBranch().getName() + " lúc " + booking.getReservedFrom().toString().replace("T", " ") + " đã bị hủy." + refundMsg)
                .createdAt(Instant.now())
                .build();
        payload = this.save(payload);

        try {
            messagingTemplate.convertAndSendToUser(
                    booking.getUser().getEmail(),
                    "/queue/notifications",
                    notificationMapper.toResponse(payload)
            );
        } catch (Exception e) {}
    }

    public void markRead(String id) {
        Notification notification = this.notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tồn tại thông báo này"));
        notification.setRead(true);

        if (notification.getScope() == NotificationScope.USER_ONLY) {
            String currentUserId = getUserId();
            if (!notification.getUser().getId().equals(currentUserId)) {
                throw new AppException("Không có quyền!");
            }
        }
        this.notificationRepository.save(notification);
    }

    public void sendStaffChatConnectedNotification(com.fwb.restaurant.entity.User user, com.fwb.restaurant.entity.User staff) {
        Notification payload = Notification.builder()
                .type(NotificationType.BOOKING_REMINDER)
                .scope(NotificationScope.USER_ONLY)
                .user(user)
                .title("Kết nối tổng đài viên")
                .message("Bạn đã kết nối thành công với tổng đài viên " + staff.getUsername() 
                        + ". Vui lòng kiểm tra đoạn chat để được hỗ trợ!")
                .createdAt(Instant.now())
                .build();
        payload = this.save(payload);

        try {
            messagingTemplate.convertAndSendToUser(
                    user.getEmail(),
                    "/queue/notifications",
                    notificationMapper.toResponse(payload)
            );
        } catch (Exception e) {}
    }
}
