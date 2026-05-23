package com.fwb.restaurant.dto.res.chat;

import com.fwb.restaurant.utils.enums.ChatSenderType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class ChatMessageResponse {
    private String id;
    private String conversationId;
    private ChatSenderType senderType;
    private String senderName;
    private String senderId;
    private String content;
    private Instant createdAt;
}

