package com.sharestory.sharestory_backend.domain;

import com.sharestory.sharestory_backend.dto.OrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ 일반 상품 거래용 (Item)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", unique = true)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_item_id")
    private AuctionItem auctionItem;

    private Long buyerId;   // 구매자
    private Long sellerId;  // 판매자

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50, nullable = false)
    private OrderStatus status;

    private int price; // 결제 금액 (상품가 + 수수료 + 배송비)

    @Embedded
    private DeliveryInfo deliveryInfo;

    private LocalDateTime createdAt;


    @OneToMany(mappedBy = "order", cascade = CascadeType.REMOVE, orphanRemoval = true)
    @Builder.Default
    private List<TrackingHistory> histories = new ArrayList<>();
}
