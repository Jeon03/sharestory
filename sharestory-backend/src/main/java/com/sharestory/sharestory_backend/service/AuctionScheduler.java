package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.AuctionBid;
import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.dto.AuctionStatus;
import com.sharestory.sharestory_backend.repo.AuctionBidRepository;
import com.sharestory.sharestory_backend.repo.AuctionItemRepository;
import com.sharestory.sharestory_backend.repo.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AuctionScheduler {

    private final AuctionItemRepository auctionItemRepository;
    private final AuctionBidRepository auctionBidRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final OrderService orderService;

    /**
     * ⏰ 매 1분마다 실행되어 종료된 경매 자동 낙찰 처리
     */
    @Scheduled(fixedRate = 10000)
    @Transactional
    public void checkEndedAuctions() {
        List<AuctionItem> endedList = auctionItemRepository
                .findByStatusAndEndDateTimeBefore(AuctionStatus.ONGOING, LocalDateTime.now());

        if (endedList.isEmpty()) {
            System.out.println("⏰ [Scheduler] 종료된 경매 없음 (" + LocalDateTime.now() + ")");
            return;
        }

        System.out.println("⏰ [Scheduler] 종료된 경매 수: " + endedList.size());

        for (AuctionItem item : endedList) {
            System.out.println("➡️ [Scheduler] 처리 대상 경매: ID=" + item.getId() +
                    ", 제목=" + item.getTitle() + ", 종료시각=" + item.getEndDateTime());
            handleAuctionEnd(item);
        }
    }

    private void handleAuctionEnd(AuctionItem item) {
        System.out.println("🔍 [Scheduler] 경매 종료 처리 시작 → ID=" + item.getId());

        Optional<AuctionBid> topBidOpt =
                auctionBidRepository.findTopByAuctionItemIdOrderByBidPriceDesc(item.getId());

        if (topBidOpt.isPresent()) {
            AuctionBid topBid = topBidOpt.get();
            System.out.println("🏆 [Scheduler] 최고입찰자 발견 → userId=" + topBid.getUserId()
                    + ", 금액=" + topBid.getBidPrice());

            item.setWinnerId(topBid.getUserId());
            item.setWinningPrice(topBid.getBidPrice());
            item.setStatus(AuctionStatus.FINISHED);
            auctionItemRepository.save(item);

            try {
                System.out.println("🛒 [Scheduler] 안전거래(Order) 생성 시도...");
                orderService.createSafeOrderFromAuction(item);
                System.out.println("✅ [Scheduler] Order 생성 완료");
            } catch (Exception e) {
                System.err.println("❌ [Scheduler] Order 생성 실패: " + e.getMessage());
                e.printStackTrace();
            }

            sendNotifications(item, topBid);
        } else {
            System.out.println("⚠️ [Scheduler] 입찰자 없음 → 경매 취소 처리");
            item.setStatus(AuctionStatus.CANCELLED);
            auctionItemRepository.save(item);
        }
    }


    private void sendNotifications(AuctionItem item, AuctionBid topBid) {
        // 판매자에게 알림
        userRepository.findById(item.getSellerId()).ifPresent(seller ->
                notificationService.sendNotification(
                        seller,
                        "AUCTION_SOLD",
                        String.format("[%s] 경매가 %s원에 낙찰되었습니다.",
                                item.getTitle(), String.format("%,d", topBid.getBidPrice())),
                        item.getId()
                )
        );

        // 낙찰자(구매자)에게 알림
        userRepository.findById(topBid.getUserId()).ifPresent(buyer ->
                notificationService.sendNotification(
                        buyer,
                        "AUCTION_WON",
                        String.format("[%s] 경매에 낙찰되었습니다. 안전거래를 진행해주세요.", item.getTitle()),
                        item.getId()
                )
        );
    }
}
