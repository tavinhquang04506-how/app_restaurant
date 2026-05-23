package com.fwb.restaurant.dto.req.favorite;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FavoriteFoodRequest {
    @NotBlank(message = "Vui lòng chọn món ăn")
    private String foodId;
}

