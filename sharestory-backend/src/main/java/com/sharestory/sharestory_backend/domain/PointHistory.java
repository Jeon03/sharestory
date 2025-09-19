package com.sharestory.sharestory_backend.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "point_history")
public class PointHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어느 유저의 내역인지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // 변동 금액 (충전 +, 사용 -)
    @Column(nullable = false)
    private int amount;

    // 변동 후 잔액
    @Column(nullable = false)
    private int balance;

    // 내역 타입 (CHARGE, USE, REFUND 등)
    @Column(nullable = false, length = 20)
    private String type;

    // 상세 설명
    @Column(length = 255)
    private String description;

    // 생성 시각
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}
