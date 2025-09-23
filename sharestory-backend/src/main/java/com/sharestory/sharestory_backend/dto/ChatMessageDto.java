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
    private Long id;
    private Long roomId;
    private Long senderId;
    private String content;
    private ChatMessage.MessageType type;
    private LocalDateTime createdAt;
    private boolean read;

    public static ChatMessageDto from(ChatMessage msg, boolean read) {
        return ChatMessageDto.builder()
                .id(msg.getId())
                .roomId(msg.getRoom().getId())
                .senderId(msg.getSenderId())
                .content(msg.getContent())
                .type(msg.getType())
                .createdAt(msg.getCreatedAt())
                .read(read)
                .build();
    }


    public static ChatMessageDto from(ChatMessage msg) {
        return from(msg, false);
    }
}
