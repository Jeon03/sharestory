package com.sharestory.sharestory_backend.dto;

import com.sharestory.sharestory_backend.domain.CommunityPost;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PostResponseDto {
    private Long id;
    private Long authorId; // ✅ 작성자 ID 추가
    private String authorNickname;
    private String category;
    private String title;
    private String content;
    private int viewCount;
    private int likeCount;
    private int commentCount;
    private boolean isLiked; // ✅ 현재 사용자의 좋아요 여부 추가
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String imageUrl; // ✅ imageUrl 필드 추가
    // 기존 fromEntity 메소드 (isLiked 정보가 필요 없을 때 사용)
    public static PostResponseDto fromEntity(CommunityPost post) {
        return fromEntity(post, false); // 기본값은 false
    }

    // ✅ 오버로딩: isLiked 상태를 받아 DTO를 생성하는 메소드
    public static PostResponseDto fromEntity(CommunityPost post, boolean isLiked) {
        return PostResponseDto.builder()
                .id(post.getId())
                .authorId(post.getAuthor().getId()) // authorId 설정
                .authorNickname(post.getAuthor().getNickname())
                .category(post.getCategory())
                .title(post.getTitle())
                .content(post.getContent())
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .isLiked(isLiked) // isLiked 설정
                .imageUrl(post.getImageUrl())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}