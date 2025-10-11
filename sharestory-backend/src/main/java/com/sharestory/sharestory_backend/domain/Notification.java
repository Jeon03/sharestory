package com.sharestory.sharestory_backend.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient; // 알림을 받는 사람

    @Column(nullable = false)
    private String message; // 알림 메시지 (예: "'A' 게시글에 새 댓글이 달렸습니다.")

    @Column(nullable = false)
    private String link; // 클릭 시 이동할 경로 (예: "/community/posts/123")

    @Builder.Default
    private boolean isRead = false; // 읽음 여부
}