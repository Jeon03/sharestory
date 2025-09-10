package com.sharestory.sharestory_backend.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
@Getter
@Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Entity
@Table(name = "refresh_tokens", indexes = @Index(columnList = "userId", unique = true))
public class RefreshToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String tokenHash; // 해시 저장 권장
    private Instant expiresAt;
}