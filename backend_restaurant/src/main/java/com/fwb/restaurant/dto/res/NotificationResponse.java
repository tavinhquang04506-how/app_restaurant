package com.fwb.restaurant.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class NotificationResponse {
    private String id;
    private String type;
    private String title;
    private String message;
    private String image;
    private Instant createdAt;
    private boolean read;
}
