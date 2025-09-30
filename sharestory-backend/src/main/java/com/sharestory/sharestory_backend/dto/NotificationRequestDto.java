package com.sharestory.sharestory_backend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class NotificationRequestDto {
    private Long roomId;
    private String message;
}