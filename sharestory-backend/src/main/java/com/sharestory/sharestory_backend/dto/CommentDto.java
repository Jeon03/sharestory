package com.sharestory.sharestory_backend.dto;

import com.sharestory.sharestory_backend.domain.Comment;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentDto {
    private Long id;
    private String authorName;
    private String content;
    private LocalDateTime createdAt;
    private List<CommentDto> replies;
    private Long userId;

    public static CommentDto from(Comment entity) {
        return CommentDto.builder()
                .id(entity.getId())
                .authorName(entity.getAuthor().getNickname())
                .content(entity.getContent())
                .userId(entity.getAuthor().getId())
                .createdAt(entity.getCreatedAt())
                .replies(entity.getReplies() == null
                        ? new ArrayList<>()
                        : entity.getReplies().stream()
                        .map(CommentDto::from)
                        .toList())
                .build();
    }
}
