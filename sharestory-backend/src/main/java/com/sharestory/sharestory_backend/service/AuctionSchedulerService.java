package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.domain.BidDeposit;
import com.sharestory.sharestory_backend.domain.BidEntity;
import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.dto.ItemStatus;
import com.sharestory.sharestory_backend.repo.AuctionItemRepository;
import com.sharestory.sharestory_backend.repo.BidDepositRepository;
import com.sharestory.sharestory_backend.repo.BidRepository;
import com.sharestory.sharestory_backend.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuctionSchedulerService {

    private final AuctionItemRepository auctionItemRepository;
    private final BidRepository bidRepository;
    private final UserRepository userRepository;
    private final BidDepositRepository bidDepositRepository;

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void closeExpiredAuctions() {
        log.info("⏰ 경매 마감 스케줄러 실행: {}", LocalDateTime.now());

        List<AuctionItem> expiredItems = auctionItemRepository.findByStatusAndAuctionEndBefore(
                ItemStatus.ON_AUCTION, LocalDateTime.now());

        if (expiredItems.isEmpty()) {
            log.info("🏁 마감할 경매 상품이 없습니다.");
            return;
        }

        log.info("⏳ 총 {}개의 경매 상품을 마감 처리합니다.", expiredItems.size());

        for (AuctionItem item : expiredItems) {
            Optional<BidEntity> highestBidOptional = bidRepository.findTopByAuctionItemOrderByBidPriceDesc(item);

            if (highestBidOptional.isPresent()) {
                BidEntity highestBid = highestBidOptional.get();
                User winner = highestBid.getBidder();
                int finalPrice = highestBid.getBidPrice();

                // 낙찰자 포인트 차감 로직은 User 엔티티에 잠금을 걸고 진행하는 것이 더 안전합니다.
                User lockedWinner = userRepository.findByIdWithLock(winner.getId())
                        .orElseThrow(() -> new RuntimeException("낙찰자 정보를 찾을 수 없습니다."));

                if (lockedWinner.getPoints() >= finalPrice) {
                    lockedWinner.setPoints(lockedWinner.getPoints() - finalPrice);
                    userRepository.save(lockedWinner);

                    item.setStatus(ItemStatus.SOLD_OUT);
                    item.setFinalBidPrice(finalPrice);
                    item.setHighestBidder(lockedWinner);
                    item.setBuyer(lockedWinner);
                    log.info("✅ [낙찰 성공] 상품 ID: {}, 낙찰자 ID: {}, 낙찰가: {}", item.getId(), lockedWinner.getId(), finalPrice);
                } else {
                    item.setStatus(ItemStatus.SOLD_OUT);
                    log.warn("⚠️ [유찰 - 포인트 부족] 상품 ID: {}, 낙찰 예정자 ID: {}", item.getId(), lockedWinner.getId());
                }
            } else {
                item.setStatus(ItemStatus.SOLD_OUT);
                log.info("💨 [유찰 - 입찰자 없음] 상품 ID: {}", item.getId());
            }

            // 경매 참여자들의 보증금을 환불합니다.
            List<BidDeposit> depositsToRefund = bidDepositRepository.findAllByAuctionItem(item);

            for (BidDeposit deposit : depositsToRefund) {
                User bidder = userRepository.findByIdWithLock(deposit.getUser().getId()).orElse(null);
                if (bidder != null) {
                    bidder.setCurrentTotalBidPrice(bidder.getCurrentTotalBidPrice() - deposit.getAmount());
                    userRepository.save(bidder);
                }
            }

            // 환불 처리가 끝난 BidDeposit 기록을 전부 삭제합니다.
            bidDepositRepository.deleteAll(depositsToRefund);
            log.info("   - [보증금 정리 완료] 상품 ID: {} 관련 BidDeposit 기록 전체 삭제 및 환불 완료", item.getId());
        }

        auctionItemRepository.saveAll(expiredItems);
    }
}