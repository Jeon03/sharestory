package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.service.CommunityLikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/community/likes")
public class CommunityLikeController {

    private final CommunityLikeService likeService;

    /** ❤️ 좋아요 토글 */
    @PostMapping("/{postId}")
    public ResponseEntity<Boolean> toggleLike(
            @PathVariable Long postId,
            @RequestParam Long userId) {
        boolean liked = likeService.toggleLike(postId, userId);
        return ResponseEntity.ok(liked);
    }

    /** ❤️ 좋아요 여부 확인 */
    @GetMapping("/{postId}")
    public ResponseEntity<Boolean> isLiked(
            @PathVariable Long postId,
            @RequestParam Long userId) {
        boolean liked = likeService.isLiked(postId, userId);
        return ResponseEntity.ok(liked);
    }
}
