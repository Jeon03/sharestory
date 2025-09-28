package com.sharestory.sharestory_backend.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class PendingOrder {
    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne
    private Item item;

    @ManyToOne
    private User buyer;

    private int price;

    @Embedded
    private DeliveryInfo deliveryInfo;

    private LocalDateTime createdAt = LocalDateTime.now();
}
