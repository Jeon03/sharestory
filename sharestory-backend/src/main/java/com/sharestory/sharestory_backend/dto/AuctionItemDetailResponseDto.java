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

    private int minPrice;
    private int finalBidPrice;
    private Integer buyNowPrice;

    // ✅ [수정된 부분] 즉시 구매 가능 여부 필드 추가
    private boolean buyNowAvailable;

    private LocalDateTime auctionStart;
    private LocalDateTime auctionEnd;
    private ItemStatus status;
    private UserDto seller;
    private UserDto highestBidder;
    private List<String> imageUrls;
    private int viewCount;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class UserDto {
        private Long id;
        private String nickname;
        private String email;
        private int points;
    }
}