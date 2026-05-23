package com.fwb.restaurant.dto.req.user;

import com.fwb.restaurant.utils.enums.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.Length;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MeUpdateRequest {
    @NotBlank(message = "Tên không được để trống...")
    @Length(min = 3, message = "Độ dài của tên ít nhất 3 kí tự...")
    private String username;

    @NotBlank(message = "Số điện thoại không được để trống...")
    @Pattern(
            regexp = "^(0[35789][0-9]{8})$",
            message = "Vui lòng nhập đúng định dạng số điện thoại...")
    private String phone;

    private String avatarUrl;
    private Gender gender;
}

