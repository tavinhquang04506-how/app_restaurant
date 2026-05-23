package com.fwb.restaurant.mapper;

import com.fwb.restaurant.dto.req.food.FoodRequest;
import com.fwb.restaurant.dto.res.FoodResponse;
import com.fwb.restaurant.entity.Food;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface FoodMapper {
    @Mapping(target = "sold", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "branchFoods", ignore = true)
    Food toFood(FoodRequest foodRequest);
    FoodResponse toFoodResponse(Food food);

    @Mapping(target = "sold", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "branchFoods", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFood(FoodRequest foodRequest, @MappingTarget Food food);
}
