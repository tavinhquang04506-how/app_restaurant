package com.fwb.restaurant.dto.res.chat;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class ChatConversationResponse {
    private String id;
    private String userId;
    private String username;
    private String userEmail;
    private String avatar;
    private Instant lastMessageAt;
    private String lastMessagePreview;
    private String status;
    private String assignedStaffId;
    private String assignedStaffName;
    private List<ChatMessageResponse> messages;
}

