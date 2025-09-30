package com.sharestory.sharestory_backend.domain;

import com.sharestory.sharestory_backend.dto.ItemStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuctionItemDoc {

    private Long id;

    // 검색 필드
    private String title;
    private String titleSuggest;
    private String titleNgram;
    private String category;

    // 필터링 및 정렬 필드
    private GeoPoint location;
    private int minPrice;
    private LocalDateTime createdAt;
    private LocalDateTime auctionEnd;
    private ItemStatus itemStatus;
    private LocalDateTime auctionStart;

    // 표시용 필드
    private String imageUrl;
    private Integer favoriteCount;
    private Long sellerId;
    private String sellerNickname;

    private LocalDateTime updatedAt;
    private Integer viewCount;
    private Integer chatRoomCount;


    @Getter @Setter @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GeoPoint {
        private double lat;
        private double lon;
    }

    public static AuctionItemDoc fromEntity(AuctionItem entity) {
        if (entity == null) {
            return null;
        }

        Long sellerId = null;
        String sellerNickname = null;
        if (entity.getSeller() != null) {
            sellerId = entity.getSeller().getId();
            sellerNickname = entity.getSeller().getNickname();
        }

        GeoPoint location = null;
        if (entity.getLatitude() != null && entity.getLongitude() != null) {
            location = GeoPoint.builder()
                    .lat(entity.getLatitude())
                    .lon(entity.getLongitude())
                    .build();
        }

        return AuctionItemDoc.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .titleSuggest(entity.getTitle())
                .titleNgram(entity.getTitle())
                .category(entity.getCategory())
                .location(location)
                .minPrice(entity.getMinPrice())
                .createdAt(entity.getCreatedAt())
                .auctionEnd(entity.getAuctionEnd())
                .itemStatus(entity.getStatus())
                .imageUrl(entity.getImageUrl())
                .favoriteCount(entity.getFavoriteCount())
                .sellerId(sellerId)
                .sellerNickname(sellerNickname)
                .auctionStart(entity.getAuctionStart())
                .updatedAt(entity.getUpdatedAt())
                .viewCount(entity.getViewCount())
                .chatRoomCount(entity.getChatRoomCount())
                .build();
    }
}