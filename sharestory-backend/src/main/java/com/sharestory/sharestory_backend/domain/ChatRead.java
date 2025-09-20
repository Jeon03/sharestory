package com.sharestory.sharestory_backend.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "chat_read")
public class ChatRead {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private ChatMessage message;

    private Long userId; // User 엔티티 참조 대신 ID만 저장

    @Column(name = "is_read", nullable = false)
    private boolean read;

    private LocalDateTime readAt;
}
