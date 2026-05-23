package com.fwb.restaurant.dto.req.auth;

import com.fwb.restaurant.utils.validation.PasswordValid;
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
@PasswordValid
public class RegisterRequest {
    @NotBlank(message = "Tên không được để trống...")
    @Length(min = 3, message = "Độ dài của tên ít nhất 3 kí tự...")
    private String username;

    @NotBlank(message = "Email không được để trống...")
    @Email(message = "Vui lòng nhập đúng định dạng email...")
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống...")
    @Pattern(
            regexp = "^(0[35789][0-9]{8})$",
            message = "Vui lòng nhập đúng định dạng số điện thoại..."
    )
    private String phone;
    @NotBlank(message = "Mật khẩu không được để trống")
    @Length(min = 8, message = "Độ dài mật khẩu ít nhất 8 kí tự")
    @Pattern(
            regexp = ".*[A-Z].*",
            message = "Mật khẩu phải chứa ít nhất một ký tự in hoa"
    )
    private String password;
    @NotBlank(message = "Mật khẩu xác nhận không được để trống")
    private String confirmPassword;
}
