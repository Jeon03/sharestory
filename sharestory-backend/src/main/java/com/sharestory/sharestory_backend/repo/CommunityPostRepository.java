package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.CommunityPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {

    // Haversine 공식을 사용하여 거리 계산 (MySQL/MariaDB 기준)
    // 6371을 곱하면 km 단위로 거리가 나옵니다.
    @Query(value = "SELECT * FROM community_post p WHERE " +
            "(6371 * acos(cos(radians(:lat)) * cos(radians(p.latitude)) * " +
            "cos(radians(p.longitude) - radians(:lon)) + sin(radians(:lat)) * " +
            "sin(radians(p.latitude)))) < :distance " +
            "ORDER BY p.created_at DESC", nativeQuery = true)
    List<CommunityPost> findPostsByLocation(
            @Param("lat") Double lat,
            @Param("lon") Double lon,
            @Param("distance") Double distance
    );
}