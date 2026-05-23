package com.fwb.restaurant.service;

import com.fwb.restaurant.dto.req.promotion.PromotionRequest;
import com.fwb.restaurant.dto.res.PromotionResponse;
import com.fwb.restaurant.entity.Promotion;
import com.fwb.restaurant.repository.PromotionRepository;
import com.fwb.restaurant.utils.error.ConflictException;
import com.fwb.restaurant.utils.error.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final NotificationService notificationService;

    @Transactional
    public PromotionResponse create(PromotionRequest request) {
        promotionRepository.findByCodeIgnoreCase(request.getCode().trim())
                .ifPresent(existing -> {
                    throw new ConflictException("Mã khuyến mãi đã tồn tại");
                });
        Promotion promotion = mapToEntity(new Promotion(), request);
        Promotion saved = promotionRepository.save(promotion);
        this.notificationService.sendNewPromotionNotification(saved);
        return toResponse(saved);
    }

    @Transactional
    public PromotionResponse update(String id, PromotionRequest request) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khuyến mãi"));
        if (!promotion.getCode().equalsIgnoreCase(request.getCode().trim())) {
            promotionRepository.findByCodeIgnoreCase(request.getCode().trim())
                    .ifPresent(existing -> {
                        throw new ConflictException("Mã khuyến mãi đã tồn tại");
                    });
        }
        Promotion updated = mapToEntity(promotion, request);
        return toResponse(promotionRepository.save(updated));
    }

    @Transactional(readOnly = true)
    public List<PromotionResponse> getAll() {
        return promotionRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PromotionResponse> getAvailable() {
        LocalDateTime now = LocalDateTime.now();
        return promotionRepository.findAvailable(now).stream()
                .filter(p -> p.getRemaining() > 0)
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void delete(String id) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khuyến mãi"));
        promotionRepository.delete(promotion);
    }

    @Transactional
    public PromotionDiscount reservePromotion(String code, BigDecimal subtotal) {
        if (!StringUtils.hasText(code)) {
            throw new ConflictException("Mã khuyến mãi không hợp lệ");
        }
        Promotion promotion = promotionRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khuyến mãi"));
        LocalDateTime now = LocalDateTime.now();
        if (!promotion.isAvailable(now)) {
            throw new ConflictException("Khuyến mãi đã hết hoặc không còn hiệu lực");
        }
        if (subtotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ConflictException("Tổng đơn hàng không hợp lệ để áp dụng khuyến mãi");
        }

        BigDecimal discount = subtotal
                .multiply(BigDecimal.valueOf(promotion.getDiscountPercent()))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

        promotion.setUsed(promotion.getUsed() + 1);
        promotionRepository.save(promotion);

        return new PromotionDiscount(promotion, discount);
    }

    private Promotion mapToEntity(Promotion promotion, PromotionRequest request) {
        promotion.setCode(request.getCode().trim().toUpperCase());
        promotion.setName(request.getName());
        promotion.setDescription(request.getDescription());
            promotion.setImageUrl(request.getImageUrl());
        promotion.setDiscountPercent(request.getDiscountPercent());
        promotion.setQuantity(request.getQuantity());
        if (promotion.getUsed() > promotion.getQuantity()) {
            promotion.setUsed(promotion.getQuantity());
        }
        promotion.setStartDate(request.getStartDate());
        promotion.setEndDate(request.getEndDate());
        promotion.setActive(request.isActive());
        return promotion;
    }

    private PromotionResponse toResponse(Promotion promotion) {
        return PromotionResponse.builder()
                .id(promotion.getId())
                .code(promotion.getCode())
                .name(promotion.getName())
                .description(promotion.getDescription())
                .imageUrl(promotion.getImageUrl())
                .discountPercent(promotion.getDiscountPercent())
                .quantity(promotion.getQuantity())
                .remaining(promotion.getRemaining())
                .active(promotion.isActive())
                .startDate(promotion.getStartDate())
                .endDate(promotion.getEndDate())
                .build();
    }

    public record PromotionDiscount(Promotion promotion, BigDecimal discountAmount) {}
}

