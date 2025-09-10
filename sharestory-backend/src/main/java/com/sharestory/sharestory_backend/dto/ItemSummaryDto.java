package com.sharestory.sharestory_backend.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ItemSummaryDto {
    private Long id;
    private String title;
    private Integer price;
    private String imageUrl;     // 대표 이미지
    private String createdDate;  // ISO 문자열 추천
    private String itemStatus;   // "ON_SALE"
    private Integer favoriteCount;
    private Integer viewCount;
    private Integer chatRoomCount;
    private Double latitude;
    private Double longitude;
}