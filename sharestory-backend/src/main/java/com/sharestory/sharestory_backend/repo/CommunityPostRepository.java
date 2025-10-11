package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.CommunityPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {

    // 위치 기반 조회
    @Query(value = "SELECT * FROM community_post p WHERE " +
            "(6371 * acos(cos(radians(:lat)) * cos(radians(p.latitude)) * " +
            "cos(radians(p.longitude) - radians(:lon)) + sin(radians(:lat)) * " +
            "sin(radians(p.latitude)))) < :distance " +
            // ✅ [수정] created_at -> created_date
            "ORDER BY p.created_date DESC", nativeQuery = true)
    List<CommunityPost> findPostsByLocation(
            @Param("lat") Double lat,
            @Param("lon") Double lon,
            @Param("distance") Double distance
    );

    // 위치 + 카테고리 기반 조회
    @Query(value = "SELECT * FROM community_post p WHERE " +
            "(6371 * acos(cos(radians(:lat)) * cos(radians(p.latitude)) * " +
            "cos(radians(p.longitude) - radians(:lon)) + sin(radians(:lat)) * " +
            "sin(radians(p.latitude)))) < :distance " +
            "AND p.category = :category " +
            // ✅ [수정] created_at -> created_date
            "ORDER BY p.created_date DESC", nativeQuery = true)
    List<CommunityPost> findPostsByLocationAndCategory(
            @Param("lat") Double lat,
            @Param("lon") Double lon,
            @Param("distance") Double distance,
            @Param("category") String category
    );
}