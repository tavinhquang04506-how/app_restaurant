package com.fwb.restaurant.repository;

import com.fwb.restaurant.entity.ChatConversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, String> {
    Optional<ChatConversation> findByUserId(String userId);

    List<ChatConversation> findByLastMessageAtAfterOrderByLastMessageAtDesc(Instant instant);

    List<ChatConversation> findByLastMessageAtBefore(Instant instant);

    List<ChatConversation> findByLastMessageAtIsNull();
}

