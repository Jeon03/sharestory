package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.CommunityLike;
import com.sharestory.sharestory_backend.domain.CommunityPost;
import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.repo.CommunityLikeRepository;
import com.sharestory.sharestory_backend.repo.CommunityPostRepository;
import com.sharestory.sharestory_backend.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CommunityLikeService {

    private final CommunityLikeRepository likeRepository;
    private final CommunityPostRepository postRepository;
    private final UserRepository userRepository;

    /** ✅ 좋아요 토글 */
    @Transactional
    public boolean toggleLike(Long postId, Long userId) {
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보가 없습니다."));

        return likeRepository.findByPostIdAndUserId(postId, userId)
                .map(existing -> {
                    likeRepository.delete(existing);
                    post.setLikeCount(post.getLikeCount() - 1);
                    return false; // 좋아요 취소됨
                })
                .orElseGet(() -> {
                    likeRepository.save(CommunityLike.builder().post(post).user(user).build());
                    post.setLikeCount(post.getLikeCount() + 1);
                    return true; // 좋아요 등록됨
                });
    }

    /** ✅ 특정 게시글의 좋아요 수 조회 */
    public long countLikes(Long postId) {
        return likeRepository.countByPostId(postId);
    }

    /** ✅ 사용자가 해당 글을 좋아요 했는지 */
    public boolean isLiked(Long postId, Long userId) {
        return likeRepository.findByPostIdAndUserId(postId, userId).isPresent();
    }
}
