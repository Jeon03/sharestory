package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.CommunityPost;
import com.sharestory.sharestory_backend.domain.User;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {


    /** 📍 지역명으로 게시글 검색 시 author도 함께 로딩 */
    @EntityGraph(attributePaths = "author")
    List<CommunityPost> findByLocationNameContainingIgnoreCase(String region);

    /** 📍 전체 게시글 조회 시 author도 함께 로딩 */
    @EntityGraph(attributePaths = "author")
    List<CommunityPost> findAll();

    @Modifying
    @Query("UPDATE CommunityPost p SET p.viewCount = p.viewCount + 1 WHERE p.id = :postId")
    void incrementViewCount(@Param("postId") Long postId);


    List<CommunityPost> findByAuthor(User author);
}
