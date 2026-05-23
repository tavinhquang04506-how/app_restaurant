package com.fwb.restaurant.dto.res;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private String id;
    private String username;
    private String email;
    private String phone;
    private String avatar;
    private String gender;
    private Role role;
    private String branchId;
    private String branchName;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Role {
        private String name;
    }
}
