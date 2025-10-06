package com.sharestory.sharestory_backend.dto;

import com.sharestory.sharestory_backend.domain.DealInfo;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionItemRequestDto {

    private String title;
    private String category;
    private String description;
    private String condition;
    private DealInfo dealInfo;
    private Double latitude;
    private Double longitude;
    private Integer reservePrice;
    private Integer buyNowPrice;
    // ✅ BigDecimal -> int 로 타입을 변경
    private int minPrice;

    private LocalDateTime auctionStart;
    private LocalDateTime auctionEnd;

    private List<Long> deletedImageIds;
}