package com.sharestory.sharestory_backend.domain;

import com.sharestory.sharestory_backend.dto.AuctionStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ 판매자, 낙찰자
    private Long sellerId;
    private Long buyerId;

    // ✅ 기본 상품 정보
    private String title;
    private String description;
    private String category;
    private String conditionType;

    // ✅ 경매 정보
    private int startPrice;             // 시작가
    private int currentPrice;           // 🔥 현재 최고 입찰가
    private int bidUnit;                // 입찰 단위
    private Integer immediatePrice;     // 즉시구매가 (선택)
    private boolean immediateAvailable; // 즉시구매 가능 여부
    private LocalDateTime endDateTime;  // 종료 시각

    // ✅ 통계 데이터
    private int viewCount;              // 👁 조회수
    private int bidCount;               // 💸 입찰 횟수

    // ✅ 이미지 관련
    private String mainImageUrl;        // 대표 이미지 (첫 번째 이미지)

    // ✅ 생성 및 상태 관리
    private LocalDateTime createdAt;

    // ✅ 경매 상태 (추가하면 편리 — 예: 진행중, 종료됨 등)
    @Enumerated(EnumType.STRING)
    private AuctionStatus status;

    // ✅ 이미지 리스트 (양방향 매핑)
    @OneToMany(mappedBy = "auctionItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AuctionImage> images = new ArrayList<>();
}

