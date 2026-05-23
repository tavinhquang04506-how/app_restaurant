package com.fwb.restaurant.dto.req.branchfood;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BranchFoodRequest {
    @NotNull(message = "Giá không được để trống...")
    @Min(value = 1000, message = "Giá phải lớn hơn 1.000 VND...")
    private long price;

    @NotBlank(message = "Chi nhánh không được để trống...")
    private String branchId;
    @NotBlank(message = "Món ăn không được để trống...")
    private String foodId;
}
