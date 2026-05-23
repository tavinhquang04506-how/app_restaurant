package com.fwb.restaurant.entity;

import com.fwb.restaurant.utils.enums.ConversationStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "chat_conversations")
public class ChatConversation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    @Column(name = "last_message_preview", length = 255)
    private String lastMessagePreview;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private ConversationStatus status = ConversationStatus.WAITING;

    @ManyToOne
    @JoinColumn(name = "assigned_staff_id")
    private User assignedStaff;
}

