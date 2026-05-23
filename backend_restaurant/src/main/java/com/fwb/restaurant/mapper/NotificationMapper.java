package com.fwb.restaurant.mapper;

import com.fwb.restaurant.dto.res.NotificationResponse;
import com.fwb.restaurant.entity.Notification;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface NotificationMapper {
    NotificationResponse toResponse(Notification notification);
}
