package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.CommunityComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommunityCommentRepository extends JpaRepository<CommunityComment, Long> {
    List<CommunityComment> findByPostIdOrderByCreatedAtAsc(Long postId);
}