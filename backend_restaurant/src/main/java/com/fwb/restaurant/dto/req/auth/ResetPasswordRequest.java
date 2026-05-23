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
public class ResetPasswordRequest {
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Mã OTP không được để trống")
    @Pattern(regexp = "^[0-9]{6}$", message = "Mã OTP phải gồm 6 chữ số")
    private String otp;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Length(min = 8, message = "Mật khẩu tối thiểu 8 ký tự")
    @Pattern(
            regexp = ".*[A-Z].*",
            message = "Mật khẩu phải chứa ít nhất một ký tự in hoa"
    )
    private String password;

    @NotBlank(message = "Xác nhận mật khẩu không được để trống")
    private String confirmPassword;
}

