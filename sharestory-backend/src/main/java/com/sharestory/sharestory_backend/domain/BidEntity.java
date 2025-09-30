package com.sharestory.sharestory_backend.domain;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "bid")
public class BidEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidder_id", nullable = false)
    private User bidder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_item_id", nullable = false)
    private AuctionItem auctionItem;

    // ✅ BigDecimal -> int 로 타입을 변경합니다.
    @Column(nullable = false)
    private int bidPrice;

    @Column(nullable = false)
    private LocalDateTime bidTime;

    @Builder
    public BidEntity(User bidder, AuctionItem auctionItem, int bidPrice, LocalDateTime bidTime) {
        this.bidder = bidder;
        this.auctionItem = auctionItem;
        this.bidPrice = bidPrice;
        this.bidTime = bidTime;
    }
}