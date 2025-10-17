package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.CommunityPost;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {


    /** 📍 지역명으로 게시글 검색 시 author도 함께 로딩 */
    @EntityGraph(attributePaths = "author")
    List<CommunityPost> findByLocationNameContainingIgnoreCase(String region);

    /** 📍 전체 게시글 조회 시 author도 함께 로딩 */
    @EntityGraph(attributePaths = "author")
    List<CommunityPost> findAll();

}
