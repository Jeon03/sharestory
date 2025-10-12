package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.AuctionBid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AuctionBidRepository extends JpaRepository<AuctionBid, Long> {
    List<AuctionBid> findByAuctionItemIdOrderByBidPriceDesc(Long auctionItemId);
    void deleteAllByAuctionItemId(Long auctionItemId);

    @Query("SELECT DISTINCT b.userId FROM AuctionBid b WHERE b.auctionItemId = :auctionId")
    List<Long> findDistinctUserIdsByAuctionItemId(@Param("auctionId") Long auctionId);

    Optional<AuctionBid> findByAuctionItemIdAndUserId(Long auctionItemId, Long userId);

    Optional<AuctionBid> findTopByAuctionItemIdOrderByBidPriceDesc(Long auctionItemId);
}
