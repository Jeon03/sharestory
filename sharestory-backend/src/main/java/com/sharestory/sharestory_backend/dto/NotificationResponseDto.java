package com.sharestory.sharestory_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sharestory.sharestory_backend.domain.Notification;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NotificationResponseDto {

    private Long id;
    private String message;
    private String type;
    private Long referenceId;
    @JsonProperty("isRead")
    private boolean isRead;
    private LocalDateTime createdAt;

    public static NotificationResponseDto from(Notification entity) {
        return NotificationResponseDto.builder()
                .id(entity.getId())
                .message(entity.getMessage())
                .type(entity.getType())
                .referenceId(entity.getReferenceId())
                .isRead(entity.isRead())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
