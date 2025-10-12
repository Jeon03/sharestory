package com.sharestory.sharestory_backend.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_tracking")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String courier;        // 택배사
    private String trackingNumber; // 송장번호

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", unique = true, nullable = true)
    private Item item;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_item_id", unique = true, nullable = true)
    private AuctionItem auctionItem;

    @Column(length = 50)
    private String status; // "배송 준비중", "배송중", "배송완료" 등

    // ✅ 주문과의 연결 (메일, FCM, 상태 전송 시 사용)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    private LocalDateTime createdAt = LocalDateTime.now();
}
