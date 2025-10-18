package com.sharestory.sharestory_backend.repo;

import co.elastic.clients.elasticsearch._types.query_dsl.Like;
import com.sharestory.sharestory_backend.domain.CommunityLike;
import com.sharestory.sharestory_backend.domain.CommunityPost;
import com.sharestory.sharestory_backend.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommunityLikeRepository extends JpaRepository<CommunityLike, Long> {
    Optional<CommunityLike> findByPostIdAndUserId(Long postId, Long userId);
    long countByPostId(Long postId);
    void deleteByPost(CommunityPost post);
    List<CommunityLike> findByUser(User user);
}
