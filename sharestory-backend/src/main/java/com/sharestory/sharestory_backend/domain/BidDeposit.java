package com.sharestory.sharestory_backend.domain;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bid_deposit",
        uniqueConstraints = { // ✅ 한 사용자는 한 경매에 하나의 보증금만 가질 수 있도록 제약조건 설정
                @UniqueConstraint(
                        name = "UK_USER_AUCTION_ITEM",
                        columnNames = {"user_id", "auction_item_id"}
                )
        }
)
public class BidDeposit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auction_item_id", nullable = false)
    private AuctionItem auctionItem;

    // 이 경매에 대한 이 유저의 현재 최고 입찰액 (보증금액)
    @Column(nullable = false)
    private int amount;
}