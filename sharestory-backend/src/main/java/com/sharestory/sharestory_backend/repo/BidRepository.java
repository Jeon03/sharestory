package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.domain.BidEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface BidRepository extends JpaRepository<BidEntity, Long> {

    // 특정 경매 상품의 모든 입찰 내역을 가격순으로 조회
    List<BidEntity> findByAuctionItemIdOrderByBidPriceDesc(Long auctionItemId);

    // 특정 경매 상품의 모든 입찰 내역을 시간순으로 조회
    List<BidEntity> findByAuctionItemIdOrderByBidTimeDesc(Long auctionItemId);

    // 특정 경매 상품의 최고 입찰액 조회 (결과가 없을 수 있으므로 Optional)
    @Query("SELECT MAX(b.bidPrice) FROM BidEntity b WHERE b.auctionItem.id = :itemId")
    Optional<BigDecimal> findMaxBidPriceByAuctionItemId(@Param("itemId") Long itemId);

    // 특정 아이템에 대한 특정 사용자의 최고 입찰액 조회
    @Query("SELECT MAX(b.bidPrice) FROM BidEntity b WHERE b.bidder.id = :userId AND b.auctionItem.id = :itemId")
    Optional<BigDecimal> findHighestBidPriceByUserAndItem(@Param("userId") Long userId, @Param("itemId") Long itemId);
    Optional<BidEntity> findTopByAuctionItemOrderByBidPriceDesc(AuctionItem auctionItem);
}