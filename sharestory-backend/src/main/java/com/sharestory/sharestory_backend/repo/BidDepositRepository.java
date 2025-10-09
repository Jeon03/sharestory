package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.domain.BidDeposit;
import com.sharestory.sharestory_backend.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BidDepositRepository extends JpaRepository<BidDeposit, Long> {

    // 특정 사용자와 경매 상품으로 보증금 정보를 찾기
    Optional<BidDeposit> findByUserAndAuctionItem(User user, AuctionItem auctionItem);

    // 특정 사용자의 총 보증금(총 입찰액) 합산
    @Query("SELECT COALESCE(SUM(bd.amount), 0) FROM BidDeposit bd WHERE bd.user = :user")
    int sumAmountByUser(@Param("user") User user);

    // 특정 경매 상품과 관련된 모든 보증금 기록 삭제
    void deleteAllByAuctionItem(AuctionItem auctionItem);

    // ✅ [추가] 특정 경매 상품과 관련된 모든 보증금 기록을 조회 (오류 해결)
    List<BidDeposit> findAllByAuctionItem(AuctionItem auctionItem);
}