package com.fwb.restaurant.dto.req.branchfood;

import com.fwb.restaurant.specification.FilterField;
import com.fwb.restaurant.specification.FilterOperator;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BranchFoodSpecRequest {
    @FilterField(operator = FilterOperator.GREATER_THAN, column = "price")
    private Long minPrice;
    @FilterField(operator = FilterOperator.LESS_THAN, column = "price")
    private Long maxPrice;

    @FilterField(column = "branch.id")
    private String branchId;

    @FilterField(operator = FilterOperator.LIKE, column = "food.name")
    private String keyword;

    @FilterField(column = "food.category.id")
    private String categoryId;
}
