package com.fwb.restaurant.dto.req.food;

import com.fwb.restaurant.specification.FilterField;
import com.fwb.restaurant.specification.FilterOperator;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FoodSpecRequest {
    @FilterField(operator = FilterOperator.LIKE)
    private String name;

    @FilterField(operator = FilterOperator.GREATER_THAN, column = "price")
    private Long minPrice;

    @FilterField(operator = FilterOperator.LESS_THAN, column = "price")
    private Long maxPrice;

    @FilterField(column = "category.id")
    private String categoryId;
}
