package com.fwb.restaurant.dto.req.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginRequest {
    @NotBlank(message = "Username không được để trống")
    @Email(message = "Vui lòng nhập đúng định dạng email")
    private String username;

    @NotBlank(message = "Password không được để trống")
    private String password;
}
