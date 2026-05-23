package com.fwb.restaurant.repository;

import com.fwb.restaurant.entity.ChatConversation;
import com.fwb.restaurant.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {
    List<ChatMessage> findByConversationOrderByCreatedAtAsc(ChatConversation conversation);

    void deleteByCreatedAtBefore(Instant threshold);
}

