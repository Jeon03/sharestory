package com.sharestory.sharestory_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sharestory.sharestory_backend.domain.Notification;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationDto {
    private Long id;
    private String type;
    private String message;
    private Long referenceId;

    @JsonProperty("isRead")
    private boolean isRead;

    private String createdAt;

    public static NotificationDto from(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .type(n.getType())
                .message(n.getMessage())
                .referenceId(n.getReferenceId())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt().toString())
                .build();
    }
}
