package com.fwb.restaurant.dto.req.category;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CategoryRequest {
    @NotBlank(message = "Tên loại không được để trống")
    private String name;
    @NotBlank(message = "Mô tả không được để trống")
    private String description;
}
