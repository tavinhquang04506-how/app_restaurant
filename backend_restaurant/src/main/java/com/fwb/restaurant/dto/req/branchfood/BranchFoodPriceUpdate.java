package com.fwb.restaurant.dto.req.branchfood;

import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BranchFoodPriceUpdate {
    @Min(value = 1000, message = "Giá phải lớn hơn 1.000...")
    private long price;
}
