package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.domain.BidEntity;
import com.sharestory.sharestory_backend.domain.User;
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

    // 특정 경매 상품(itemId)에 대해, 특정 입찰자(currentBidderId)를 제외한
    // 모든 유니크한 입찰자(User) 목록을 조회합니다.
    @Query("SELECT DISTINCT b.bidder FROM BidEntity b WHERE b.auctionItem.id = :itemId AND b.bidder.id != :currentBidderId")
    List<User> findDistinctBiddersByAuctionItemExceptCurrent(@Param("itemId") Long itemId, @Param("currentBidderId") Long currentBidderId);

    // 특정 경매 상품에 입찰한 모든 고유한 입찰자 목록을 반환합니다.
    @Query("SELECT DISTINCT b.bidder FROM BidEntity b WHERE b.auctionItem = :auctionItem")
    List<User> findDistinctBiddersByAuctionItem(@Param("auctionItem") AuctionItem auctionItem);

    // ✅ [수정된 코드] 반환 타입을 Optional<Integer>로 변경
    // 특정 경매 상품에 대해 특정 사용자가 입찰한 최고 입찰액을 반환합니다.
    @Query("SELECT MAX(b.bidPrice) FROM BidEntity b WHERE b.bidder.id = :userId AND b.auctionItem.id = :auctionItemId")
    Optional<Integer> findHighestBidPriceByBidderIdAndAuctionItemId(@Param("userId") Long userId, @Param("auctionItemId") Long auctionItemId);
}