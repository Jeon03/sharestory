// src/main/java/com/sharestory/sharestory_backend/dto/ItemDetailResponse.java
package com.sharestory.sharestory_backend.dto;

import com.sharestory.sharestory_backend.domain.DealInfo;
import lombok.*;

import java.util.List;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class ItemDetailResponse {
    private Long id;
    private Long userId;
    private Long sellerId;
    private Long buyerId;

    private String title;
    private int price;
    private String description;
    private String category;
    private String createdDate;   // ISO 문자열(프론트에서 Date 파싱 용이)

    private String condition;     // ✅ 여욱님이 말한 "상품상태"
    private String itemStatus;    // ✅ Enum → 문자열 (예: "ON_SALE")

    private String imageUrl;      // 대표 이미지(옵션)
    private List<String> images;  // 다중 이미지 URL

    // 위치 표시용 (프론트에서 좌표→행정동 변환)
    private Double latitude;
    private Double longitude;

    private DealInfo dealInfo;    // 택배/직거래/안전거래/배송비 옵션
}
