package com.sharestory.sharestory_backend.dto;

import com.sharestory.sharestory_backend.domain.DealInfo;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionItemCreateRequestDto {

    private String title;
    private String category;
    private String description;
    private String condition;
    private DealInfo dealInfo;
    private Double latitude;
    private Double longitude;

    // ✅ BigDecimal -> int 로 타입을 변경했습니다.
    private int minPrice;

    // ✅ auctionDuration 필드가 필요합니다.
    private long auctionDuration;
}
