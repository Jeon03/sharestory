package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.domain.BidDeposit;
import com.sharestory.sharestory_backend.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BidDepositRepository extends JpaRepository<BidDeposit, Long> {

    // ✅ 사용자와 경매 상품으로 보증금 정보를 찾음 (UPSERT 로직에 사용)
    Optional<BidDeposit> findByUserAndAuctionItem(User user, AuctionItem auctionItem);

    // ✅ 특정 사용자의 모든 보증금 총액을 계산 (입찰 시 유효성 검증에 사용)
    @Query("SELECT COALESCE(SUM(bd.amount), 0) FROM BidDeposit bd WHERE bd.user = :user")
    int sumTotalAmountByUser(@Param("user") User user);

    // ✅ 경매 종료 시 해당 경매의 모든 보증금 내역을 삭제 (스케줄러에서 사용)
    void deleteAllByAuctionItem(AuctionItem auctionItem);
}