package com.sharestory.sharestory_backend.domain;

import com.sharestory.sharestory_backend.dto.ItemStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "auction_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class AuctionItem extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String category;
    private String description;

    @Column(name = "item_condition")
    private String condition;

    @Embedded
    private DealInfo dealInfo;

    private Double latitude;
    private Double longitude;

    // --- 경매 관련 필드 ---
    @Column(nullable = false)
    private int minPrice;

    @Column(nullable = false)
    private LocalDateTime auctionStart;

    @Column(nullable = false)
    private LocalDateTime auctionEnd;

    @Column(name = "final_bid_price", nullable = false)
    @ColumnDefault("0")
    @Builder.Default
    private int finalBidPrice = 0;

    // --- 상태 및 시간 관련 필드 ---
    @Enumerated(EnumType.STRING)
    @Column(name = "item_status", nullable = false)
    private ItemStatus status;

    // --- 통계 관련 필드 ---
// AuctionItem.java

// ...

    @Column(name = "favorite_count", nullable = false, columnDefinition = "int default 0")
    @Builder.Default
    private int favoriteCount = 0;

    @Column(name = "view_count", nullable = false, columnDefinition = "int default 0")
    @Builder.Default
    private int viewCount = 0;

// ... (chat_room_count, bid_count 도 동일하게 수정)

    @Column(name = "chat_room_count", nullable = false)
    @ColumnDefault("0")
    @Builder.Default
    private int chatRoomCount = 0;

    @Column(name = "bid_count", nullable = false)
    @ColumnDefault("0")
    @Builder.Default
    private int bidCount = 0;

    // --- 연관 관계 매핑 ---
    @OneToMany(mappedBy = "auctionItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<AuctionItemImage> images = new ArrayList<>();

    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id")
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "highest_bidder_id")
    private User highestBidder;

    @OneToMany(mappedBy = "auctionItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BidEntity> bids = new ArrayList<>();
}