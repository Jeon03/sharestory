package com.sharestory.sharestory_backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrackingHistoryDto {
    private LocalDateTime time;
    private String desc;
}
