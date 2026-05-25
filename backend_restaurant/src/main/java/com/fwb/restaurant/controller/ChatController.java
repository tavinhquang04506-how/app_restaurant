package com.fwb.restaurant.controller;

import com.fwb.restaurant.dto.req.chat.ChatMessageRequest;
import com.fwb.restaurant.dto.res.chat.ChatConversationResponse;
import com.fwb.restaurant.dto.res.chat.ChatMessageResponse;
import com.fwb.restaurant.service.ChatService;
import com.fwb.restaurant.utils.annotations.ApiMessage;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chat")
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/conversations")
    @ApiMessage("Get All Conversations Only Admin")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ChatConversationResponse> getConversations() {
        return chatService.getRecentConversationsForAdmin();
    }

    @GetMapping("/conversations/me")
    @ApiMessage("Get My Conversation")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ChatConversationResponse getMyConversation() {
        return chatService.getMyConversation();
    }

    @GetMapping("/conversations/{conversationId}/messages")
    @ApiMessage("Get Message")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ChatMessageResponse> getMessages(@PathVariable String conversationId) {
        return chatService.getMessages(conversationId);
    }

    @PostMapping("/messages")
    @ApiMessage("Send Message (fallback REST)")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public ChatMessageResponse sendMessage(@RequestBody @Valid ChatMessageRequest request,
                                           Authentication authentication) {
        boolean fromAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().contains("ADMIN"));

        ChatMessageResponse response = chatService.handleIncomingMessage(request, fromAdmin);
        ChatConversationResponse conversation = chatService.getConversationSummary(response.getConversationId());

        // Đẩy realtime giống WebSocket controller để REST fallback cũng có realtime
        messagingTemplate.convertAndSendToUser(conversation.getUserEmail(), "/queue/chat", response);

        messagingTemplate.convertAndSend("/topic/chat/conversation/" + conversation.getId(), response);

        messagingTemplate.convertAndSend("/topic/chat/conversations", conversation);

        return response;
    }

    @PostMapping("/conversations/{conversationId}/connect")
    @ApiMessage("Staff connects to conversation")
    @PreAuthorize("hasRole('ADMIN')")
    public ChatConversationResponse connectConversation(@PathVariable String conversationId) {
        return chatService.connectToConversation(conversationId);
    }

    @PostMapping("/conversations/{conversationId}/close")
    @ApiMessage("Close conversation")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public ChatConversationResponse closeConversation(@PathVariable String conversationId) {
        return chatService.closeConversation(conversationId);
    }
}

