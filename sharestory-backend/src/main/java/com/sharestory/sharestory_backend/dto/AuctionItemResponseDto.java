package com.sharestory.sharestory_backend.dto;

import com.sharestory.sharestory_backend.domain.AuctionItem;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuctionItemResponseDto {
    private Long id;
    private String title;
    private String category;
    private String conditionType;
    private int startPrice;
    private Integer immediatePrice;
    private String mainImageUrl;
    private String createdAt;
    private String endDateTime;

    public static AuctionItemResponseDto from(AuctionItem item) {
        return AuctionItemResponseDto.builder()
                .id(item.getId())
                .title(item.getTitle())
                .category(item.getCategory())
                .conditionType(item.getConditionType())
                .startPrice(item.getStartPrice())
                .immediatePrice(item.getImmediatePrice())
                .mainImageUrl(item.getMainImageUrl())
                .createdAt(item.getCreatedAt() != null ? item.getCreatedAt().toString() : null)
                .endDateTime(item.getEndDateTime() != null ? item.getEndDateTime().toString() : null)
                .build();
    }
}
