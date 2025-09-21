package com.sharestory.sharestory_backend.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatReadDto {
    private Long roomId;
    private Long userId;     // 읽은 사람 ID
    private List<Long> readIds;
}