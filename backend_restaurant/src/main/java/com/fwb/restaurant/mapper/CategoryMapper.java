package com.fwb.restaurant.mapper;

import com.fwb.restaurant.dto.req.category.CategoryRequest;
import com.fwb.restaurant.dto.res.CategoryResponse;
import com.fwb.restaurant.entity.Category;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CategoryMapper {
    Category toCategory(CategoryRequest categoryRequest);

    CategoryResponse toCategoryResponse(Category category);
}
