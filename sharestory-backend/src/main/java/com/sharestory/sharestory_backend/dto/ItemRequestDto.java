package com.sharestory.sharestory_backend.dto;

import com.sharestory.sharestory_backend.domain.DealInfo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemRequestDto {

    private String title;           // 상품명
    private String category;        // 카테고리
    private String condition;       // 상태 (중고, 새상품 등)
    private int price;              // 가격
    private String description;     // 설명
    private Double latitude;        // 위도
    private Double longitude;       // 경도

    private DealInfo dealInfo;      // 거래 방식 (택배/직거래/안전거래)
}
