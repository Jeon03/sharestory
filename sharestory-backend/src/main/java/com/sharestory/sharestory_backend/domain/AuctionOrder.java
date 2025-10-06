package com.sharestory.sharestory_backend.domain;

import com.sharestory.sharestory_backend.dto.OrderStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "auction_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class AuctionOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_item_id", unique = true)
    private AuctionItem auctionItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id")
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    private User seller;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50, nullable = false)
    private OrderStatus status;

    @Column(nullable = false)
    private int price; // 최종 낙찰가

    @Embedded
    private DeliveryInfo deliveryInfo;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}