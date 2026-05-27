package com.fwb.restaurant.dto.req.food;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FoodRequest {
    @NotBlank(message = "Tên món ăn không được để trống...")
    private String name;
    @NotBlank(message = "Mô tả món ăn không được để trống...")
    private String description;
    @NotBlank(message = "Ảnh nền món ăn không được để trống...")
    private String thumbUrl;
    @NotNull(message = "Giá món ăn không được để trống...")
    @Min(value = 1000, message = "Giá tiền phải từ 1.000 VND")
    private long price;
    @NotBlank(message = "Loại món ăn không được để trống...")
    private String categoryId;
    private boolean active = true;
}
