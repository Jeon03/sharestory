package com.sharestory.sharestory_backend.domain;

import com.sharestory.sharestory_backend.dto.OrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private Item item;

    private Long buyerId;   // 구매자
    private Long sellerId;  // 판매자

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    private int price; // 결제 금액 (상품가 + 수수료 + 배송비)

    @Embedded
    private DeliveryInfo deliveryInfo;

    private LocalDateTime createdAt;
}
