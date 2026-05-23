package com.fwb.restaurant.mapper;

import com.fwb.restaurant.dto.req.auth.RegisterRequest;
import com.fwb.restaurant.dto.req.user.UserCreateRequest;
import com.fwb.restaurant.dto.req.user.UserUpdateRequest;
import com.fwb.restaurant.dto.res.LoginResponse;
import com.fwb.restaurant.dto.res.UserResponse;
import com.fwb.restaurant.entity.User;
import com.fwb.restaurant.utils.UserDetailsCustom;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "branch", ignore = true)
    User toUser(UserCreateRequest req);
    User toUser(RegisterRequest req);
    
    @Mapping(source = "avatarUrl", target = "avatar")
    @Mapping(source = "gender", target = "gender")
    @Mapping(source = "branch.id", target = "branchId")
    @Mapping(source = "branch.name", target = "branchName")
    UserResponse toUserResponse(User user);

    @Mapping(source = "displayName", target = "username")
    LoginResponse.UserLoginResponse toUserLoginResponse(UserDetailsCustom userDetailsCustom);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "branch", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateUser(UserUpdateRequest userUpdateRequest, @MappingTarget User user);
}
