package com.sharestory.sharestory_backend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class BidNotificationRequestDto {
    private Long itemId;
    private Integer bidAmount;
}