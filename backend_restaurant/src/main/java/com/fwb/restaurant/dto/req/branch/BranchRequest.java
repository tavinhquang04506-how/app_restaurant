package com.fwb.restaurant.dto.req.branch;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BranchRequest {
    @NotBlank(message = "Tên chi nhánh không được để trống...")
    private String name;

    @NotBlank(message = "Địa chỉ không được để trống...")
    private String address;

    @NotBlank(message = "Số điện thoại không được để trống...")
    @Pattern(
            regexp = "^(0[35789][0-9]{8})$",
            message = "Vui lòng nhập đúng định dạng số điện thoại...")
    private String phone;

    @NotNull(message = "Thời gian mở không được để trống...")
    private LocalTime openTime;

    @NotNull(message = "Thời gian mở không được để trống...")
    private LocalTime closeTime;

    private String imageUrl;
}
