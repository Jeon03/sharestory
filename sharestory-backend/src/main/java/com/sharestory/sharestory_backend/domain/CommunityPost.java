package com.sharestory.sharestory_backend.domain;

import jakarta.persistence.*;
import lombok.*;

// 이전에 만들어둔 BaseTimeEntity를 상속하여 createdAt, updatedAt 자동화
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunityPost extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author; // 작성자 (기존 User 엔티티 활용)

    @Column(nullable = false, length = 20)
    private String category; // 카테리 (예: '동네질문', '일상', '맛집')

    @Column(nullable = false, length = 100)
    private String title; // 제목

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content; // 내용

    // 게시글 작성 시점의 위치 정보 (사용자 기본 위치)
    private Double latitude;
    private Double longitude;

    @Builder.Default
    private int viewCount = 0;

    @Builder.Default
    private int likeCount = 0;

    @Builder.Default
    private int commentCount = 0;
}