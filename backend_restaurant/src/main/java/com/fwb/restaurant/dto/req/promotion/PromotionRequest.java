package com.fwb.restaurant.dto.req.promotion;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

@Data
public class PromotionRequest {

    @NotBlank(message = "Mã khuyến mãi không được để trống")
    private String code;

    @NotBlank(message = "Tên khuyến mãi không được để trống")
    private String name;

    private String description;

    private String imageUrl;

    @Min(value = 1, message = "Phần trăm giảm tối thiểu là 1%")
    @Max(value = 100, message = "Phần trăm giảm tối đa là 100%")
    private int discountPercent;

    @Positive(message = "Số lượng áp dụng phải lớn hơn 0")
    private int quantity;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime startDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime endDate;

    private boolean active = true;
}

