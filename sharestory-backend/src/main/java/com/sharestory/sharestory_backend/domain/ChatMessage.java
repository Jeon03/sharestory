package com.sharestory.sharestory_backend.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ 채팅방과 N:1 관계
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    @JsonIgnore
    private ChatRoom room;

    private Long senderId;

    @Column(columnDefinition = "TEXT")
    private String content;

    // ✅ 메시지 타입 (TEXT, IMAGE, LOCATION_MAP, LOCATION_TEXT)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MessageType type;

    private LocalDateTime createdAt;

    public enum MessageType {
        TEXT,
        IMAGE,
        SYSTEM,
        LOCATION_MAP,
        LOCATION_TEXT
    }
}
