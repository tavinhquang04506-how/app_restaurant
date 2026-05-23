package com.fwb.restaurant.controller;

import com.fwb.restaurant.dto.req.chat.ChatMessageRequest;
import com.fwb.restaurant.dto.res.chat.ChatConversationResponse;
import com.fwb.restaurant.dto.res.chat.ChatMessageResponse;
import com.fwb.restaurant.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/send")
    public void handleMessage(ChatMessageRequest request, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role != null && (role.contains("ADMIN") || role.contains("STAFF")));

        String email = authentication.getName();
        ChatMessageResponse response = chatService.handleIncomingMessageForEmail(request, isAdmin, email);
        ChatConversationResponse conversation = chatService.getConversationSummary(response.getConversationId());

        messagingTemplate.convertAndSendToUser(
                conversation.getUserEmail(),
                "/queue/chat",
                response
        );

        messagingTemplate.convertAndSend(
                "/topic/chat/conversation/" + conversation.getId(),
                response
        );

        messagingTemplate.convertAndSend(
                "/topic/chat/conversations",
                conversation
        );
    }
}

