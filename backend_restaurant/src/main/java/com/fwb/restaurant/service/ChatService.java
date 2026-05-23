package com.fwb.restaurant.service;

import com.fwb.restaurant.dto.req.chat.ChatMessageRequest;
import com.fwb.restaurant.dto.res.chat.ChatConversationResponse;
import com.fwb.restaurant.dto.res.chat.ChatMessageResponse;
import com.fwb.restaurant.entity.ChatConversation;
import com.fwb.restaurant.entity.ChatMessage;
import com.fwb.restaurant.entity.User;
import com.fwb.restaurant.repository.ChatConversationRepository;
import com.fwb.restaurant.repository.ChatMessageRepository;
import com.fwb.restaurant.repository.UserRepository;
import com.fwb.restaurant.utils.SecurityUtils;
import com.fwb.restaurant.utils.enums.ChatSenderType;
import com.fwb.restaurant.utils.enums.ConversationStatus;
import com.fwb.restaurant.utils.error.ConflictException;
import com.fwb.restaurant.utils.error.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    private static final int EXPIRATION_DAYS = 1;

    public ChatConversation getConversationOrCreateForUser(User user) {
        return conversationRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    ChatConversation conversation = new ChatConversation();
                    conversation.setUser(user);
                    conversation.setLastMessageAt(Instant.now());
                    return conversationRepository.save(conversation);
                });
    }

    public ChatConversation getConversationById(String id) {
        return conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc trò chuyện"));
    }

    public List<ChatConversationResponse> getRecentConversationsForAdmin() {
        Instant threshold = Instant.now().minus(EXPIRATION_DAYS, ChronoUnit.DAYS);
        return conversationRepository.findByLastMessageAtAfterOrderByLastMessageAtDesc(threshold)
                .stream()
                .filter(c -> c.getStatus() != ConversationStatus.CLOSED)
                .map(conversation -> toConversationResponse(conversation, false))
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatConversationResponse connectToConversation(String conversationId) {
        User staff = getCurrentUser();
        ChatConversation conversation = getConversationById(conversationId);
        conversation.setStatus(ConversationStatus.CONNECTED);
        conversation.setAssignedStaff(staff);
        conversationRepository.save(conversation);

        // 1. Create auto welcome message from staff
        ChatMessage welcomeMessage = new ChatMessage();
        welcomeMessage.setConversation(conversation);
        welcomeMessage.setSenderType(ChatSenderType.ADMIN);
        welcomeMessage.setSenderId(staff.getId());
        welcomeMessage.setSenderName(staff.getUsername());
        
        String welcomeContent = "Xin chào " + conversation.getUser().getUsername() 
                + ", tôi là tổng đài viên " + staff.getUsername() 
                + ". Tôi rất sẵn lòng hỗ trợ và giải quyết mọi vấn đề của bạn ngày hôm nay!";
        welcomeMessage.setContent(welcomeContent);
        
        ChatMessage savedMsg = chatMessageRepository.save(welcomeMessage);
        
        // 2. Update conversation preview
        conversation.setLastMessageAt(Instant.now());
        conversation.setLastMessagePreview(trimPreview(savedMsg.getContent()));
        conversationRepository.save(conversation);

        // 3. Send system database and WebSocket notification
        notificationService.sendStaffChatConnectedNotification(conversation.getUser(), staff);

        // 4. Push WebSocket realtime updates
        ChatMessageResponse msgResponse = toMessageResponse(savedMsg);
        ChatConversationResponse convResponse = toConversationResponse(conversation, true);
        
        try {
            // Push message to user
            messagingTemplate.convertAndSendToUser(conversation.getUser().getEmail(), "/queue/chat", msgResponse);
            // Push message to active chat room
            messagingTemplate.convertAndSend("/topic/chat/conversation/" + conversation.getId(), msgResponse);
            // Push updated conversation list to admin dashboard
            messagingTemplate.convertAndSend("/topic/chat/conversations", convResponse);
        } catch (Exception e) {}

        return convResponse;
    }

    @Transactional
    public ChatConversationResponse closeConversation(String conversationId) {
        ChatConversation conversation = getConversationById(conversationId);
        
        // Security check: USER can only close their own conversation
        User currentUser = getCurrentUser();
        if ("USER".equalsIgnoreCase(currentUser.getRole().getName())) {
            if (!conversation.getUser().getId().equals(currentUser.getId())) {
                throw new com.fwb.restaurant.utils.error.ConflictException("Bạn không có quyền kết thúc cuộc trò chuyện này");
            }
        }
        
        conversation.setStatus(ConversationStatus.CLOSED);
        conversationRepository.save(conversation);
        
        ChatConversationResponse convResponse = toConversationResponse(conversation, false);
        try {
            // Push updated conversation status to admin dashboard and user
            messagingTemplate.convertAndSend("/topic/chat/conversations", convResponse);
            messagingTemplate.convertAndSend("/topic/chat/conversation/" + conversation.getId(), convResponse);
        } catch (Exception e) {}
        
        return convResponse;
    }

    public ChatConversationResponse getMyConversation() {
        User current = getCurrentUser();
        ChatConversation conversation = getConversationOrCreateForUser(current);
        return toConversationResponse(conversation, true);
    }

    public List<ChatMessageResponse> getMessages(String conversationId) {
        ChatConversation conversation = getConversationById(conversationId);
        return chatMessageRepository.findByConversationOrderByCreatedAtAsc(conversation)
                .stream()
                .map(this::toMessageResponse)
                .collect(Collectors.toList());
    }

    public ChatConversationResponse getConversationSummary(String conversationId) {
        ChatConversation conversation = getConversationById(conversationId);
        return toConversationResponse(conversation, false);
    }

    @Transactional
    public ChatMessageResponse handleIncomingMessage(ChatMessageRequest request, boolean fromAdmin) {
        User currentUser = getCurrentUser();
        return doHandleIncomingMessage(request, fromAdmin, currentUser);
    }

    @Transactional
    public ChatMessageResponse handleIncomingMessageForEmail(ChatMessageRequest request, boolean fromAdmin, String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        return doHandleIncomingMessage(request, fromAdmin, currentUser);
    }

    private ChatMessageResponse doHandleIncomingMessage(ChatMessageRequest request, boolean fromAdmin, User currentUser) {
        ChatConversation conversation;
        if (request.getConversationId() != null && !request.getConversationId().isBlank()) {
            conversation = getConversationById(request.getConversationId());
        } else if (!fromAdmin) {
            conversation = getConversationOrCreateForUser(currentUser);
        } else {
            if (request.getTargetUserId() == null || request.getTargetUserId().isBlank()) {
                throw new ConflictException("Vui lòng chọn người dùng để chat");
            }
            User target = userRepository.findById(request.getTargetUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng để chat"));
            conversation = getConversationOrCreateForUser(target);
        }

        if (!fromAdmin && !conversation.getUser().getId().equals(currentUser.getId())) {
            throw new ConflictException("Bạn không thể gửi tin nhắn trong cuộc trò chuyện này");
        }

        ChatSenderType senderType = fromAdmin ? ChatSenderType.ADMIN : ChatSenderType.USER;
        ChatMessage message = new ChatMessage();
        message.setConversation(conversation);
        message.setSenderType(senderType);
        message.setSenderId(currentUser.getId());
        message.setSenderName(currentUser.getUsername());
        message.setContent(request.getContent().trim());

        ChatMessage saved = chatMessageRepository.save(message);
        conversation.setLastMessageAt(Instant.now());
        conversation.setLastMessagePreview(trimPreview(saved.getContent()));
        
        if (!fromAdmin) {
            if (conversation.getStatus() == ConversationStatus.CLOSED || conversation.getStatus() == null) {
                conversation.setStatus(ConversationStatus.WAITING);
                conversation.setAssignedStaff(null);
            }
        }
        
        conversationRepository.save(conversation);

        return toMessageResponse(saved);
    }

    public void deleteExpiredConversations() {
        Instant threshold = Instant.now().minus(EXPIRATION_DAYS, ChronoUnit.DAYS);
        chatMessageRepository.deleteByCreatedAtBefore(threshold);
        List<ChatConversation> expired = conversationRepository.findByLastMessageAtBefore(threshold);
        expired.addAll(conversationRepository.findByLastMessageAtIsNull());
        conversationRepository.deleteAll(expired);
    }

    private ChatConversationResponse toConversationResponse(ChatConversation conversation, boolean includeMessages) {
        List<ChatMessageResponse> messages = includeMessages
                ? chatMessageRepository.findByConversationOrderByCreatedAtAsc(conversation)
                    .stream()
                    .map(this::toMessageResponse)
                    .collect(Collectors.toList())
                : null;

        return ChatConversationResponse.builder()
                .id(conversation.getId())
                .userId(conversation.getUser().getId())
                .username(conversation.getUser().getUsername())
                .userEmail(conversation.getUser().getEmail())
                .avatar(conversation.getUser().getAvatarUrl())
                .lastMessageAt(conversation.getLastMessageAt())
                .lastMessagePreview(conversation.getLastMessagePreview())
                .status(conversation.getStatus() != null ? conversation.getStatus().name() : "WAITING")
                .assignedStaffId(conversation.getAssignedStaff() != null ? conversation.getAssignedStaff().getId() : null)
                .assignedStaffName(conversation.getAssignedStaff() != null ? conversation.getAssignedStaff().getUsername() : null)
                .messages(messages)
                .build();
    }

    private ChatMessageResponse toMessageResponse(ChatMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .senderType(message.getSenderType())
                .senderId(message.getSenderId())
                .senderName(message.getSenderName())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private String trimPreview(String content) {
        return content.length() > 120 ? content.substring(0, 120) + "..." : content;
    }

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new ResourceNotFoundException("Vui lòng đăng nhập"));
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
    }
}

