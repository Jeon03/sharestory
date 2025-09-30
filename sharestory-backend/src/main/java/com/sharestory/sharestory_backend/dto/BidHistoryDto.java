package com.sharestory.sharestory_backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class BidHistoryDto {
    private String bidderNickname;
    private int bidPrice;
    private LocalDateTime bidTime;
}