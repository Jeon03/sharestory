package com.sharestory.sharestory_backend.dto;

import com.sharestory.sharestory_backend.domain.AuctionItem;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Builder
@Getter
public class AuctionItemDto {
    private Long id;
    private Long sellerId;
    private String sellerNickname;
    private Long buyerId;
    private String title;
    private String description;
    private String category;
    private String conditionType;

    private int startPrice;
    private int currentPrice;
    private int bidUnit;
    private Integer immediatePrice;
    private boolean immediateAvailable;
    private LocalDateTime endDateTime;

    private int viewCount;
    private int bidCount;

    private String mainImageUrl;
    private List<String> imageUrls;
    private LocalDateTime createdAt;
    private String status;

    public static AuctionItemDto from(AuctionItem item) {
        return AuctionItemDto.builder()
                .id(item.getId())
                .sellerId(item.getSellerId())
                .buyerId(item.getBuyerId())
                .title(item.getTitle())
                .description(item.getDescription())
                .category(item.getCategory())
                .conditionType(item.getConditionType())
                .startPrice(item.getStartPrice())
                .currentPrice(item.getCurrentPrice())
                .bidUnit(item.getBidUnit())
                .immediatePrice(item.getImmediatePrice())
                .immediateAvailable(item.isImmediateAvailable())
                .endDateTime(item.getEndDateTime())
                .viewCount(item.getViewCount())
                .bidCount(item.getBidCount())
                .mainImageUrl(item.getMainImageUrl())
                .imageUrls(item.getImages().stream()
                        .map(img -> img.getUrl())
                        .toList())
                .createdAt(item.getCreatedAt())
                .status(item.getStatus() != null ? item.getStatus().name() : "ONGOING")
                .build();
    }
}
