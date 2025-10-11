package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.dto.CommentRequestDto;
import com.sharestory.sharestory_backend.dto.CommentResponseDto;
import com.sharestory.sharestory_backend.dto.PostRequestDto;
import com.sharestory.sharestory_backend.dto.PostResponseDto;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import com.sharestory.sharestory_backend.service.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    // 새 게시글 작성 API
    @PostMapping("/posts")
    public ResponseEntity<PostResponseDto> createPost(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody PostRequestDto requestDto
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        PostResponseDto newPost = communityService.createPost(user.getId(), requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(newPost);
    }

    // 위치 기반 게시글 목록 조회 API
    @GetMapping("/posts")
    public ResponseEntity<List<PostResponseDto>> getPostsByLocation(
            @RequestParam Double lat,
            @RequestParam Double lon,
            @RequestParam(defaultValue = "5.0") Double distance
    ) {
        List<PostResponseDto> posts = communityService.getPostsByLocation(lat, lon, distance);
        return ResponseEntity.ok(posts);
    }

    // ------------------- [ 4단계 & 5단계 추가된 API ] -------------------

    // 게시글 상세 조회 (수정하라고 말씀드린 바로 그 API 입니다)
    @GetMapping("/posts/{id}")
    public ResponseEntity<PostResponseDto> getPost(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        Long userId = (user != null) ? user.getId() : null;
        return ResponseEntity.ok(communityService.getPostById(id, userId));
    }

    // 특정 게시글의 댓글 목록 조회
    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<List<CommentResponseDto>> getComments(@PathVariable Long postId) {
        return ResponseEntity.ok(communityService.getCommentsByPostId(postId));
    }

    // 새 댓글 작성
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<CommentResponseDto> addComment(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long postId,
            @RequestBody CommentRequestDto requestDto
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        CommentResponseDto newComment = communityService.addComment(user.getId(), postId, requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(newComment);
    }

    // 좋아요 토글
    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long postId
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Map<String, Object> result = communityService.togglePostLike(user.getId(), postId);
        return ResponseEntity.ok(result);
    }

    // 게시글 삭제
    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> deletePost(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long id
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            communityService.deletePost(user.getId(), id);
            return ResponseEntity.noContent().build(); // 성공 시 204 No Content
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build(); // 권한 없을 시 403 Forbidden
        }
    }
}