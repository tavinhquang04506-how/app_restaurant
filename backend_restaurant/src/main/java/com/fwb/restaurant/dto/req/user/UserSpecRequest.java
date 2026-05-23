package com.fwb.restaurant.dto.req.user;

import com.fwb.restaurant.specification.FilterField;
import com.fwb.restaurant.specification.FilterOperator;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserSpecRequest {
    @FilterField(operator = FilterOperator.LIKE)
    private String username;

    @FilterField(operator = FilterOperator.LIKE)
    private String email;

    @FilterField(column = "branch.id", operator = FilterOperator.EQUAL)
    private String branchId;

    @FilterField(column = "role.name", operator = FilterOperator.EQUAL)
    private String roleName;
}
