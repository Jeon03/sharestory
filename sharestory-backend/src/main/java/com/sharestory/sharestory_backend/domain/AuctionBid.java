package com.sharestory.sharestory_backend.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionBid {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long auctionItemId; // 경매 상품 ID
    private Long userId;        // 입찰자 ID
    private String bidderName;  // 입찰자 닉네임
    private int bidPrice;       // 입찰 금액
    private LocalDateTime createdAt; // 입찰 시각

}
