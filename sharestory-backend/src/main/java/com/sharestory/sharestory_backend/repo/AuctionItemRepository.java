package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.dto.ItemStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuctionItemRepository extends JpaRepository<AuctionItem, Long> {

    @EntityGraph(attributePaths = {"images"})
    Optional<AuctionItem> findWithImagesById(Long id);

    @Modifying
    @Query("update AuctionItem ai set ai.viewCount = ai.viewCount + 1 where ai.id = :id")
    void incrementViewCount(@Param("id") Long id);

    List<AuctionItem> findByStatus(ItemStatus status);

    Page<AuctionItem> findByStatusOrderByAuctionEndAsc(ItemStatus status, Pageable pageable);

    @Query("SELECT ai FROM AuctionItem ai WHERE ai.status = :status ORDER BY size(ai.bids) DESC")
    Page<AuctionItem> findPopularItemsByStatus(@Param("status") ItemStatus status, Pageable pageable);

    List<AuctionItem> findByStatusAndAuctionEndBefore(ItemStatus status, LocalDateTime now);

    Page<AuctionItem> findByTitleContainingIgnoreCase(String title, Pageable pageable);
}