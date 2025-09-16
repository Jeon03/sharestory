package com.sharestory.sharestory_backend.dto;

import com.sharestory.sharestory_backend.domain.ChatMessage;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDto {
    private Long roomId;
    private Long senderId;
    private String content;
    private ChatMessage.MessageType type;   // ✅ 메시지 타입 추가
    private LocalDateTime createdAt;

    public static ChatMessageDto from(ChatMessage msg) {
        return ChatMessageDto.builder()
                .roomId(msg.getRoom().getId())
                .senderId(msg.getSenderId())
                .content(msg.getContent())
                .type(msg.getType())              // ✅ 타입 세팅
                .createdAt(msg.getCreatedAt())
                .build();
    }
}
