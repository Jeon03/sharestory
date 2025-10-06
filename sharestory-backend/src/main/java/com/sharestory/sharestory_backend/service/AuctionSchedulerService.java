package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.domain.BidEntity;
import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.dto.ItemStatus;
import com.sharestory.sharestory_backend.repo.AuctionItemRepository;
import com.sharestory.sharestory_backend.repo.BidRepository;
import com.sharestory.sharestory_backend.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuctionSchedulerService {

    private final AuctionItemRepository auctionItemRepository;
    private final BidRepository bidRepository;
    private final UserRepository userRepository;

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void closeExpiredAuctions() {
        log.info("⏰ 경매 마감 스케줄러 실행: {}", LocalDateTime.now());

        List<AuctionItem> expiredItems = auctionItemRepository.findByStatusAndAuctionEndBefore(
                ItemStatus.ON_AUCTION,
                LocalDateTime.now()
        );

        if (expiredItems.isEmpty()) {
            log.info("🏁 마감할 경매 상품이 없습니다.");
            return;
        }

        log.info("⏳ 총 {}개의 경매 상품을 마감 처리합니다.", expiredItems.size());

        List<User> usersToUpdate = new ArrayList<>();

        for (AuctionItem item : expiredItems) {
            Optional<BidEntity> highestBidOptional = bidRepository.findTopByAuctionItemOrderByBidPriceDesc(item);
            List<User> allBidders = bidRepository.findDistinctBiddersByAuctionItem(item);

            if (highestBidOptional.isPresent()) {
                BidEntity highestBid = highestBidOptional.get();
                User winner = highestBid.getBidder();
                int finalPrice = highestBid.getBidPrice();

                if (winner.getPoints() >= finalPrice) {
                    winner.setPoints(winner.getPoints() - finalPrice);

                    int winnerPreviousBid = bidRepository.findHighestBidPriceByBidderIdAndAuctionItemId(winner.getId(), item.getId())
                            .orElse(0);
                    winner.setCurrentTotalBidPrice(winner.getCurrentTotalBidPrice() - winnerPreviousBid);
                    if(!usersToUpdate.contains(winner)) usersToUpdate.add(winner);

                    item.setStatus(ItemStatus.SOLD_OUT);
                    item.setFinalBidPrice(finalPrice);
                    item.setHighestBidder(winner);
                    item.setBuyer(winner);

                    log.info("✅ [낙찰 성공] 상품 ID: {}, 낙찰자 ID: {}, 낙찰가: {}", item.getId(), winner.getId(), finalPrice);

                    for (User loser : allBidders) {
                        if (!loser.getId().equals(winner.getId())) {
                            int loserPreviousBid = bidRepository.findHighestBidPriceByBidderIdAndAuctionItemId(loser.getId(), item.getId())
                                    .orElse(0);
                            loser.setCurrentTotalBidPrice(loser.getCurrentTotalBidPrice() - loserPreviousBid);
                            if(!usersToUpdate.contains(loser)) usersToUpdate.add(loser);
                            log.info("   - [유찰자 보증금 복원] 사용자 ID: {}, 복원 금액: {}", loser.getId(), loserPreviousBid);
                        }
                    }
                } else {
                    log.warn("⚠️ [낙찰 실패 - 포인트 부족] 상품 ID: {}, 낙찰 예정자 ID: {}, 보유 포인트: {}, 낙찰가: {}",
                            item.getId(), winner.getId(), winner.getPoints(), finalPrice);
                    item.setStatus(ItemStatus.SOLD_OUT);
                    for (User bidder : allBidders) {
                        int bidderPreviousBid = bidRepository.findHighestBidPriceByBidderIdAndAuctionItemId(bidder.getId(), item.getId())
                                .orElse(0);
                        bidder.setCurrentTotalBidPrice(bidder.getCurrentTotalBidPrice() - bidderPreviousBid);
                        if(!usersToUpdate.contains(bidder)) usersToUpdate.add(bidder);
                        log.info("   - [전원 보증금 복원] 사용자 ID: {}, 복원 금액: {}", bidder.getId(), bidderPreviousBid);
                    }
                }
            } else {
                item.setStatus(ItemStatus.SOLD_OUT);
                log.info("💨 [유찰] 상품 ID: {}", item.getId());
            }
        }

        userRepository.saveAll(usersToUpdate);
        auctionItemRepository.saveAll(expiredItems);
    }
}