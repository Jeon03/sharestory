package com.sharestory.sharestory_backend.dto;

import com.sharestory.sharestory_backend.domain.DealInfo;
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
    private boolean hasSafeOrder;

    private boolean modified;     // 수정 여부
    private String updatedDate;   // 수정 시간 (optional)

    private DealInfo dealInfo;
}