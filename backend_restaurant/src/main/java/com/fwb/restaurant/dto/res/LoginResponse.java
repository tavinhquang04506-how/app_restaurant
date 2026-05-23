package com.fwb.restaurant.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LoginResponse {
    private UserLoginResponse user;
    private String accessToken;
    private String refreshToken;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class UserLoginResponse {
        private String id;
        private String username;
        private String email;
        private String phone;
        private String avatar;
        private String role;
        private String branchId;
        private String branchName;
    }
}
