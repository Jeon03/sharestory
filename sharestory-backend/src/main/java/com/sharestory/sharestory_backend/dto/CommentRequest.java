package com.sharestory.sharestory_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommentRequest {

    private Long postId;     // 게시글 ID
    private Long userId;     // 작성자 ID
    private String content;  // 댓글 내용
    private Long parentId;   // 부모 댓글 ID (null이면 일반 댓글)
}