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
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType; // ✅ import 추가
import org.springframework.web.multipart.MultipartFile; // ✅ import 추가
import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    // 새 게시글 작성 API
    @PostMapping(value = "/posts", consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<PostResponseDto> createPost(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestPart("post") PostRequestDto requestDto, // JSON 데이터
            @RequestPart(value = "image", required = false) MultipartFile image // 이미지 파일
    ) throws IOException {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        PostResponseDto newPost = communityService.createPost(user.getId(), requestDto, image);
        return ResponseEntity.status(HttpStatus.CREATED).body(newPost);
    }

    // 위치 기반 게시글 목록 조회 API
    @GetMapping("/posts")
    public ResponseEntity<List<PostResponseDto>> getPostsByLocation(
            @RequestParam Double lat,
            @RequestParam Double lon,
            @RequestParam(defaultValue = "5.0") Double distance,
            // ✅ [수정] category 파라미터를 선택적으로 받도록 추가
            @RequestParam(required = false) String category
    ) {
        List<PostResponseDto> posts = communityService.getPostsByLocation(lat, lon, distance, category);
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
    // CommunityController.java
// ...
    // ✅ [추가] 게시글 수정 API
    @PutMapping(value = "/posts/{id}", consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<PostResponseDto> updatePost(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long id,
            @RequestPart("post") PostRequestDto requestDto,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws IOException {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            PostResponseDto updatedPost = communityService.updatePost(user.getId(), id, requestDto, image);
            return ResponseEntity.ok(updatedPost);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
// ...
}