package com.fwb.restaurant.dto.req.user;

import com.fwb.restaurant.entity.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.Length;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserCreateRequest {
    @NotBlank(message = "Email không được để trống...")
    @Email(message = "Vui lòng nhập đúng định dạng email...")
    private String email;

    @NotBlank(message = "Tên không được để trống...")
    @Length(min = 3, message = "Độ dài của tên ít nhất 3 kí tự...")
    private String username;

    @NotBlank(message = "Password không được để trống...")
    @Length(min = 8, message = "Độ dài mât khẩu ít nhất 6 kí tự...")
    private String password;

    @NotBlank(message = "Số điện thoại không được để trống...")
    @Pattern(
        regexp = "^(0[35789][0-9]{8})$",
        message = "Vui lòng nhập đúng định dạng số điện thoại..."
    )
    private String phone;

    private String avatarUrl;
    private Role role;
    private String branchId;
}
