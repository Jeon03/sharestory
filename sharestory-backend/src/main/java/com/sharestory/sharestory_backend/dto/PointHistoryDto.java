package com.sharestory.sharestory_backend.dto;

import com.sharestory.sharestory_backend.domain.PointHistory;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class PointHistoryDto {
    private int amount;
    private int balance;
    private String type;
    private String description;
    private Instant createdAt;

    public static PointHistoryDto from(PointHistory history) {
        return new PointHistoryDto(
                history.getAmount(),
                history.getBalance(),
                history.getType(),
                history.getDescription(),
                history.getCreatedAt()
        );
    }
}