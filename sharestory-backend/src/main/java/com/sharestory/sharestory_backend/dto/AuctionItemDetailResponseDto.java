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
public class AuctionItemDetailResponseDto {

    private Long id;
    private String title;
    private String category;
    private String description;
    private String condition;
    private DealInfo dealInfo;
    private Double latitude;
    private Double longitude;

    // ✅ BigDecimal -> int 로 타입을 변경
    private int minPrice;
    private int finalBidPrice;

    private LocalDateTime auctionStart;
    private LocalDateTime auctionEnd;
    private ItemStatus status;
    private UserDto seller;
    private UserDto highestBidder;
    private List<String> imageUrls;
    private int viewCount;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;

// ... AuctionItemDetailResponseDto의 다른 필드들 ...

    @Getter
    @Builder
    @AllArgsConstructor
    public static class UserDto { // ✅ static 키워드 추가
        private Long id;
        private String nickname;
        private String email;
        private int points;
    }
}