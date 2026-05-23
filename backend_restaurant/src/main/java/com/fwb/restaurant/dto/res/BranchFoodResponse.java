package com.fwb.restaurant.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BranchFoodResponse {
    private String id;
    private long price;
    private boolean active;
    private BranchResponse branch;
    private FoodResponse food;
}
