package com.sharestory.sharestory_backend.dto;

import com.sharestory.sharestory_backend.domain.ChatMessage;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDto {
    private Long roomId;
    private Long senderId;
    private String content;
    private LocalDateTime createdAt;

    public static ChatMessageDto from(ChatMessage msg) {
        return ChatMessageDto.builder()
                .roomId(msg.getRoom().getId())
                .senderId(msg.getSenderId())
                .content(msg.getContent())
                .createdAt(msg.getCreatedAt())
                .build();
    }
}
