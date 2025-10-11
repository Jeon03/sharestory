package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.CommunityPost;
import com.sharestory.sharestory_backend.domain.PostLike;
import com.sharestory.sharestory_backend.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    Optional<PostLike> findByUserAndPost(User user, CommunityPost post);
    void deleteByUserAndPost(User user, CommunityPost post);
}