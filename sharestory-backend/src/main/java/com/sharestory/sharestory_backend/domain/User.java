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
@Table(name = "users", indexes = {
        @Index(columnList = "provider, providerId", unique = true),
        @Index(columnList = "email", unique = true)
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 소셜 로그인 제공자 (google, naver, kakao)
    @Column(nullable = false, length = 30)
    private String provider;

    // 소셜 로그인에서 주는 고유 사용자 ID
    @Column(nullable = false, length = 100)
    private String providerId;

    // 이메일
    @Column(length = 150, unique = true)
    private String email;

    // 닉네임
    @Column(length = 50)
    private String nickname;

    // 역할 (ROLE_USER, ROLE_ADMIN 등)
    @Column(length = 20, nullable = false)
    private String role;

    // 계정 생성 시각
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    // 마지막 로그인 시각
    private Instant lastLoginAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }


    public User(Long id) {
        this.id = id;
    }

    @Column
    private Double myLatitude;

    @Column
    private Double myLongitude;

    @Column
    private String addressName;

    @Column(nullable = false)
    private int points = 0;
}
