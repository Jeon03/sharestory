package com.sharestory.sharestory_backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(name = "favorite_auction_item")
public class FavoriteAuctionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // 어느 유저가

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_item_id", nullable = false)
    private AuctionItem auctionItem; // 어느 경매 상품을

    @CreatedDate
    @Column(name = "created_date", updatable = false)
    private LocalDateTime createdDate; // 언제 관심 등록했는지

    public static FavoriteAuctionItem of(User user, AuctionItem auctionItem) {
        FavoriteAuctionItem favorite = new FavoriteAuctionItem();
        favorite.setUser(user);
        favorite.setAuctionItem(auctionItem);
        return favorite;
    }
}