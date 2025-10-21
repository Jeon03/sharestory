package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.AuctionBid;
import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.domain.PointHistory;
import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.dto.AuctionStatus;
import com.sharestory.sharestory_backend.event.AuctionEventPublisher;
import com.sharestory.sharestory_backend.repo.AuctionBidRepository;
import com.sharestory.sharestory_backend.repo.AuctionItemRepository;
import com.sharestory.sharestory_backend.repo.PointHistoryRepository;
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
    private final ChatService chatService;
    private final AuctionEventPublisher auctionEventPublisher;
    private final PointHistoryRepository pointHistoryRepository;

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

    @Scheduled(fixedRate = 10000)
    @Transactional
    public void checkUnpaidAuctions() {
        LocalDateTime now = LocalDateTime.now();

        List<AuctionItem> expiredItems = auctionItemRepository
                .findByStatusAndPaymentDeadlineBeforeAndPenaltyAppliedFalse(AuctionStatus.FINISHED, now);

        for (AuctionItem item : expiredItems) {
            if (item.getWinnerId() == null || item.getWinningPrice() == null) continue;

            User winner = userRepository.findById(item.getWinnerId()).orElse(null);
            User seller = userRepository.findById(item.getSellerId()).orElse(null);
            if (winner == null || seller == null) continue;

            // ✅ 금액 계산
            int winningPrice = item.getWinningPrice();
            int totalPenalty = (int) (winningPrice * 0.2); // 총 20% 차감
            int refund = winningPrice - totalPenalty;      // 낙찰자 환불 금액 (80%)
            int sellerReward = (int) (winningPrice * 0.1); // 판매자 보상 10%

            // ✅ 1) 낙찰자 환불 (80%)
            winner.setPoints(winner.getPoints() + refund);
            userRepository.save(winner);

            pointHistoryRepository.save(PointHistory.builder()
                    .user(winner)
                    .amount(refund)
                    .balance(winner.getPoints())
                    .type("AUCTION_TIMEOUT_REFUND")
                    .description(String.format("[%s] 결제시간 초과 - 낙찰금 20%% 패널티 후 80%% 환불", item.getTitle()))
                    .build());

            // ✅ 2) 판매자에게 10% 보상
            seller.setPoints(seller.getPoints() + sellerReward);
            userRepository.save(seller);

            pointHistoryRepository.save(PointHistory.builder()
                    .user(seller)
                    .amount(sellerReward)
                    .balance(seller.getPoints())
                    .type("AUCTION_TIMEOUT_COMPENSATION")
                    .description(String.format("[%s] 낙찰자 미결제로 보상금 10%% 수령", item.getTitle()))
                    .build());

            // ✅ 알림 전송
            notificationService.sendNotification(
                    winner,
                    "AUCTION_TIMEOUT",
                    String.format("[%s] 결제 시간이 초과되어 낙찰금의 20%%가 차감되었습니다. (80%% 환불)", item.getTitle()),
                    item.getId()
            );

            notificationService.sendNotification(
                    seller,
                    "AUCTION_TIMEOUT_REWARD",
                    String.format("[%s] 낙찰자가 결제하지 않아 10%% 보상금을 수령했습니다.", item.getTitle()),
                    item.getId()
            );

            // ✅ 경매 상태 업데이트
            item.setPenaltyApplied(true);
            item.setStatus(AuctionStatus.CANCELLED);
            auctionItemRepository.save(item);

            System.out.printf("⚠️ [Scheduler] [%s] 낙찰자 %d 결제시간 초과 → 20%% 패널티 (판매자 10%% 보상)%n",
                    item.getTitle(), item.getWinnerId());
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
            item.setPaymentDeadline(LocalDateTime.now().plusMinutes(3));
            item.setPenaltyApplied(false);
            auctionItemRepository.save(item);

            // ✅ 비낙찰자 포인트 환불 처리 추가
            refundLosers(item.getId(), topBid.getUserId(), item.getTitle());

            try {
                System.out.println("🛒 [Scheduler] 안전거래(Order) 생성 시도...");
                orderService.createSafeOrderFromAuction(item);
                System.out.println("✅ [Scheduler] Order 생성 완료");
            } catch (Exception e) {
                System.err.println("❌ [Scheduler] Order 생성 실패: " + e.getMessage());
                e.printStackTrace();
            }

            // ✅ 트랜잭션 커밋 이후 메시지 전송을 위한 이벤트 발행
            try {
                auctionEventPublisher.publishAuctionEndedEvent(item.getId());
                System.out.println("📢 [Scheduler] AuctionEndedEvent 발행 완료 → auctionId=" + item.getId());
            } catch (Exception e) {
                System.err.println("❌ [Scheduler] AuctionEndedEvent 발행 실패: " + e.getMessage());
            }

            sendNotifications(item, topBid); // (기존 NotificationService 유지)
        } else {
            System.out.println("⚠️ [Scheduler] 입찰자 없음 → 경매 취소 처리");
            item.setStatus(AuctionStatus.CANCELLED);
            auctionItemRepository.save(item);
        }
    }

    private void sendNotifications(AuctionItem item, AuctionBid topBid) {
        // 판매자에게
        userRepository.findById(item.getSellerId()).ifPresent(seller ->
                notificationService.sendNotification(
                        seller,
                        "AUCTION_SOLD",
                        String.format("[%s] 경매가 %s원에 낙찰되었습니다. (구매자 3분 내 결제 필요)",
                                item.getTitle(), String.format("%,d", topBid.getBidPrice())),
                        item.getId()
                )
        );

        // 낙찰자에게
        userRepository.findById(topBid.getUserId()).ifPresent(buyer ->
                notificationService.sendNotification(
                        buyer,
                        "AUCTION_WON",
                        String.format("[%s] 경매에 낙찰되었습니다. 3분 내 안전거래 결제를 진행해주세요.", item.getTitle()),
                        item.getId()
                )
        );
    }

    private void refundLosers(Long auctionId, Long winnerId, String title) {
        List<AuctionBid> allBids = auctionBidRepository.findByAuctionItemId(auctionId);

        if (allBids.isEmpty()) {
            System.out.println("💤 [Scheduler] 환불 대상 입찰자 없음");
            return;
        }

        for (AuctionBid bid : allBids) {
            if (bid.getUserId().equals(winnerId)) continue; // 낙찰자 제외

            userRepository.findById(bid.getUserId()).ifPresent(loser -> {
                int refundAmount = bid.getBidPrice();
                int newBalance = loser.getPoints() + refundAmount;
                loser.setPoints(newBalance);
                userRepository.save(loser);

                // ✅ 포인트 내역 기록
                pointHistoryRepository.save(PointHistory.builder()
                        .user(loser)
                        .amount(refundAmount)
                        .balance(newBalance)
                        .type("AUCTION_REFUND")
                        .description(String.format("[%s] 경매 낙찰 실패로 포인트 환불", title))
                        .build());

                // ✅ 알림 발송
                try {
                    notificationService.sendNotification(
                            loser,
                            "AUCTION_REFUND",
                            String.format("[%s] 경매가 종료되어 입찰금이 환불되었습니다.", title),
                            auctionId
                    );
                } catch (Exception e) {
                    System.err.println("⚠️ [Scheduler] 환불 알림 실패: " + e.getMessage());
                }

                System.out.println("💰 [Scheduler] 환불 완료 → userId=" + loser.getId() + ", 금액=" + refundAmount);
            });
        }
    }
}
