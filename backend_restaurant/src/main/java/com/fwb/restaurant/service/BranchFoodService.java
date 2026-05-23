package com.fwb.restaurant.service;

import com.fwb.restaurant.dto.req.branchfood.BranchFoodActiveUpdate;
import com.fwb.restaurant.dto.req.branchfood.BranchFoodPriceUpdate;
import com.fwb.restaurant.dto.req.branchfood.BranchFoodRequest;
import com.fwb.restaurant.dto.req.branchfood.BranchFoodSpecRequest;
import com.fwb.restaurant.dto.res.BranchFoodResponse;
import com.fwb.restaurant.dto.res.BranchResponse;
import com.fwb.restaurant.dto.res.CategoryResponse;
import com.fwb.restaurant.dto.res.FoodResponse;
import com.fwb.restaurant.dto.res.PaginationResponse;
import com.fwb.restaurant.entity.Branch;
import com.fwb.restaurant.entity.BranchFood;
import com.fwb.restaurant.entity.Food;
import com.fwb.restaurant.entity.User;
import com.fwb.restaurant.repository.BranchFoodRepository;
import com.fwb.restaurant.repository.BranchRepository;
import com.fwb.restaurant.repository.FoodRepository;
import com.fwb.restaurant.repository.UserRepository;
import com.fwb.restaurant.specification.GenericSpecification;
import com.fwb.restaurant.utils.SecurityUtils;
import com.fwb.restaurant.utils.error.ConflictException;
import com.fwb.restaurant.utils.error.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BranchFoodService {
    private final BranchRepository branchRepository;
    private final FoodRepository foodRepository;
    private final BranchFoodRepository branchFoodRepository;
    private final UserRepository userRepository;
    private static final String ROLE_ADMIN = "ADMIN";
    private static final String ROLE_STAFF = "STAFF";
    private static final String ROLE_MANAGER = "MANAGER";

    public BranchFoodResponse create(BranchFoodRequest request) {
        if(this.branchFoodRepository.existsByBranchIdAndFoodId(request.getBranchId(), request.getFoodId())) {
            throw new ConflictException("Chi nhánh đã có món này");
        }

        Food food = this.foodRepository.findById(request.getFoodId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đồ ăn này..."));
        Branch branch =  this.branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh này..."));

        BranchFood branchFood = BranchFood.builder()
                .food(food)
                .branch(branch)
                .price(request.getPrice())
                .active(true)
                .build();

        return this.toResponse(this.branchFoodRepository.save(branchFood));
    }

    public PaginationResponse getAll(BranchFoodSpecRequest branchFoodSpecRequest, Pageable pageable) {
        SecurityUtils.getCurrentUserLogin().ifPresent(email -> {
            userRepository.findByEmail(email).ifPresent(user -> {
                if (isStaffOrManager(user)) {
                    Branch managedBranch = requireManagedBranch(user);
                    branchFoodSpecRequest.setBranchId(managedBranch.getId());
                }
            });
        });
        Specification<BranchFood> spec = GenericSpecification.filter(branchFoodSpecRequest);
        Page<BranchFood> page = this.branchFoodRepository.findAll(spec, pageable);

        PaginationResponse.Meta meta = PaginationResponse.Meta.builder()
                .page(page.getNumber() + 1)
                .pages(page.getTotalPages())
                .pageSize(page.getSize())
                .total(page.getTotalElements())
                .build();

        List<BranchFoodResponse> result = page.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PaginationResponse.builder()
                .meta(meta)
                .result(result)
                .build();
    }



    public BranchFoodResponse setActive(String id, BranchFoodActiveUpdate request) {
        BranchFood branchFood = this.branchFoodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tồn tại...."));
        User currentUser = getCurrentUser();
        validateBranchPermission(currentUser, branchFood.getBranch());

        branchFood.setActive(request.isActive());

        return this.toResponse(this.branchFoodRepository.save(branchFood));
    }

    public BranchFoodResponse setPrice(String id, BranchFoodPriceUpdate request) {
        BranchFood branchFood = this.branchFoodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tồn tại...."));
        User currentUser = getCurrentUser();
        validateBranchPermission(currentUser, branchFood.getBranch());

        branchFood.setPrice(request.getPrice());

        return this.toResponse(this.branchFoodRepository.save(branchFood));
    }

    public void deleteById(String id) {
        if(!this.branchFoodRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy chi nhánh này...");
        }

        this.branchFoodRepository.deleteById(id);
    }

    private BranchFoodResponse toResponse(BranchFood branchFood) {
        Food food = branchFood.getFood();
        Branch branch = branchFood.getBranch();

        CategoryResponse categoryResponse = null;
        if (food.getCategory() != null) {
            categoryResponse = new CategoryResponse(
                    food.getCategory().getId(),
                    food.getCategory().getName(),
                    food.getCategory().getDescription()
            );
        }

        FoodResponse foodResponse = FoodResponse.builder()
                .id(food.getId())
                .name(food.getName())
                .description(food.getDescription())
                .thumbUrl(food.getThumbUrl())
                .price(branchFood.getPrice())
                .sold(food.getSold())
                .avgRating(food.getAvgRating())
                .ratingCount(food.getRatingCount())
                .category(categoryResponse)
                .build();

        BranchResponse branchResponse = new BranchResponse();
        branchResponse.setId(branch.getId());
        branchResponse.setName(branch.getName());
        branchResponse.setAddress(branch.getAddress());
        branchResponse.setPhone(branch.getPhone());
        branchResponse.setImageUrl(branch.getImageUrl());
        branchResponse.setOpenTime(branch.getOpenTime());
        branchResponse.setCloseTime(branch.getCloseTime());
        branchResponse.setCreatedAt(branch.getCreatedAt());
        branchResponse.setUpdatedAt(branch.getUpdatedAt());

        return BranchFoodResponse.builder()
                .id(branchFood.getId())
                .active(branchFood.isActive())
                .price(branchFood.getPrice())
                .food(foodResponse)
                .branch(branchResponse)
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

    private boolean isManager(User user) {
        return user.getRole() != null && ROLE_MANAGER.equalsIgnoreCase(user.getRole().getName());
    }

    private boolean isStaffOrManager(User user) {
        return isStaff(user) || isManager(user);
    }

    private boolean isAdmin(User user) {
        return user.getRole() != null && ROLE_ADMIN.equalsIgnoreCase(user.getRole().getName());
    }

    private Branch requireManagedBranch(User user) {
        if (user.getBranch() == null) {
            throw new ConflictException("Nhân viên hoặc Quản lý chưa được gán chi nhánh");
        }
        return user.getBranch();
    }

    private void validateBranchPermission(User user, Branch branch) {
        if (isAdmin(user)) {
            return;
        }
        if (isStaffOrManager(user)) {
            Branch managed = requireManagedBranch(user);
            if (!managed.getId().equals(branch.getId())) {
                throw new ConflictException("Bạn không thể thao tác trên chi nhánh khác");
            }
        } else {
            throw new ConflictException("Không có quyền thực hiện thao tác này");
        }
    }
}
