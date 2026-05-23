package com.fwb.restaurant.dto.res;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FoodRatingResponse {
    private String id;
    private String username;
    private String comment;
    private int rating;
    private String createdAt;
}
