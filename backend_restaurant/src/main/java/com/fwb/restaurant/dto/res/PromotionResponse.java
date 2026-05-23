package com.fwb.restaurant.dto.res;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PromotionResponse {
    private String id;
    private String code;
    private String name;
    private String description;
    private String imageUrl;
    private int discountPercent;
    private int quantity;
    private int remaining;
    private boolean active;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}

