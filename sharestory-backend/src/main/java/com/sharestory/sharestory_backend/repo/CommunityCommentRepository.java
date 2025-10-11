package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.CommunityComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommunityCommentRepository extends JpaRepository<CommunityComment, Long> {
    List<CommunityComment> findByPostIdOrderByCreatedAtAsc(Long postId);
    // ✅ [추가] 특정 게시글에 댓글을 작성한 모든 유저 ID를 중복 없이 조회
    @Query("SELECT DISTINCT c.author.id FROM CommunityComment c WHERE c.post.id = :postId")
    List<Long> findDistinctAuthorIdsByPostId(@Param("postId") Long postId);
}
