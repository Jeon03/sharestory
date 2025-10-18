package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.dto.CommentDto;
import com.sharestory.sharestory_backend.dto.CommentRequest;
import com.sharestory.sharestory_backend.service.CommentService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<CommentDto> addComment(@RequestBody CommentRequest request) {
        CommentDto dto = commentService.addComment(
                request.getPostId(),
                request.getUserId(),
                request.getContent(),
                request.getParentId()
        );
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{postId}")
    public ResponseEntity<List<CommentDto>> getComments(@PathVariable Long postId) {
        return ResponseEntity.ok(commentService.getCommentsByPost(postId));
    }

    /** 🗑️ 댓글 삭제 */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<String> deleteComment(
            @PathVariable Long commentId,
            @RequestParam Long userId) {
        commentService.deleteComment(commentId, userId);
        return ResponseEntity.ok("댓글이 삭제되었습니다.");
    }

}


