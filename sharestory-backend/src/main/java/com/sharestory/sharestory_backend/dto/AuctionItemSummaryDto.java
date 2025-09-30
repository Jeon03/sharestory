package com.sharestory.sharestory_backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionItemSummaryDto {

    private Long id;
    private String title;
    private String imageUrl;

    // ✅ BigDecimal -> int 로 타입을 변경했습니다.
    private int currentPrice;

    private LocalDateTime auctionEnd;
    private ItemStatus status;
    private int favoriteCount;
    private String sellerNickname;
    private int viewCount;
    private int bidCount;
}

