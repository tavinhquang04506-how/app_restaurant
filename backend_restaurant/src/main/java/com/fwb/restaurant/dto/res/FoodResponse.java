package com.fwb.restaurant.dto.res;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FoodResponse {
    private String id;
    private String name;
    private String description;
    private String thumbUrl;
    private long price;
    private long sold;
    private CategoryResponse category;
    private Double avgRating;
    private Long ratingCount;
    private boolean active;
}
