package com.fwb.restaurant.dto.req.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RefreshRequest {
    @NotBlank(message = "Vui lòng truyền refreshToken để làm mới !!!")
    private String refreshToken;
}
