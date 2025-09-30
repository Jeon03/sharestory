package com.sharestory.sharestory_backend.dto;

import com.sharestory.sharestory_backend.domain.TrackingHistory;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class TrackingHistoryDto {
    private String desc;
    private LocalDateTime time;

    public TrackingHistoryDto(TrackingHistory entity) {
        this.desc = entity.getStatusText();
        this.time = entity.getTimestamp();
    }
}