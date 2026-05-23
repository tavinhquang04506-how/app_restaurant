package com.fwb.restaurant.dto.req.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GoogleIdTokenRequest {
    @NotBlank(message = "ID token is required")
    private String idToken;
}

