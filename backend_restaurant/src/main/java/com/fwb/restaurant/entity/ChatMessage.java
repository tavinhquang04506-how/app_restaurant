package com.fwb.restaurant.entity;

import com.fwb.restaurant.utils.enums.ChatSenderType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "chat_messages")
public class ChatMessage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private ChatConversation conversation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChatSenderType senderType;

    @Column(length = 1000, nullable = false)
    private String content;

    @Column(name = "sender_name")
    private String senderName;

    @Column(name = "sender_id")
    private String senderId;
}

