package com.sharestory.sharestory_backend.dto;

import com.sharestory.sharestory_backend.domain.CommunityComment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CommentResponseDto {
    private Long id;
    private String authorNickname;
    private String content;
    private LocalDateTime createdAt;

    public static CommentResponseDto fromEntity(CommunityComment comment) {
        return CommentResponseDto.builder()
                .id(comment.getId())
                .authorNickname(comment.getAuthor().getNickname())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}