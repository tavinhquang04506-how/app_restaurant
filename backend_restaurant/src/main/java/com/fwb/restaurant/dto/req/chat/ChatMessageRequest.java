package com.fwb.restaurant.dto.req.chat;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChatMessageRequest {
    private String conversationId;
    private String targetUserId;
    @NotBlank
    private String content;
}

