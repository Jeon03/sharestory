package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.AuctionBid;
import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.domain.PointHistory;
import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.repo.AuctionBidRepository;
import com.sharestory.sharestory_backend.repo.AuctionItemRepository;
import com.sharestory.sharestory_backend.repo.PointHistoryRepository;
import com.sharestory.sharestory_backend.repo.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuctionBidService {

    private final AuctionItemRepository auctionItemRepository;
    private final AuctionBidRepository auctionBidRepository;
    private final UserRepository userRepository;
    private final PointHistoryRepository pointHistoryRepository;
    private final NotificationService notificationService;

    @Transactional
    public AuctionItem placeBid(Long auctionId, Long userId, int bidPrice) {

        // 1️⃣ 경매 조회 (for update lock)
        AuctionItem item = auctionItemRepository.findByIdForUpdate(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("경매를 찾을 수 없습니다."));

        // 2️⃣ 사용자 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 3️⃣ 종료 여부 확인
        if (item.getEndDateTime().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("이미 종료된 경매입니다.");
        }

        // 4️⃣ 자기 자신 입찰 금지
        if (item.getSellerId().equals(userId)) {
            throw new IllegalStateException("자신의 상품에는 입찰할 수 없습니다.");
        }

        // 5️⃣ 최소 입찰 금액 확인
        int minBid = item.getCurrentPrice() + item.getBidUnit();
        if (bidPrice < minBid) {
            throw new IllegalArgumentException("입찰 금액은 최소 " + minBid + "원 이상이어야 합니다.");
        }

        // 6️⃣ 즉시구매 처리
        if (item.getImmediatePrice() != null && bidPrice >= item.getImmediatePrice()) {
            if (user.getPoints() < item.getImmediatePrice()) {
                throw new IllegalStateException("보유 포인트가 부족하여 즉시구매할 수 없습니다.");
            }

            int newBalance = user.getPoints() - item.getImmediatePrice();
            user.setPoints(newBalance);
            userRepository.save(user);

            pointHistoryRepository.save(PointHistory.builder()
                    .user(user)
                    .amount(-item.getImmediatePrice())
                    .balance(newBalance)
                    .type("AUCTION_BUY")
                    .description("경매 즉시구매로 포인트 차감")
                    .build());

            item.setCurrentPrice(item.getImmediatePrice());
            item.setEndDateTime(LocalDateTime.now());
            item.setBidCount(item.getBidCount() + 1);

            // 판매자에게 즉시구매 알림
            userRepository.findById(item.getSellerId()).ifPresent(seller ->
                    notificationService.sendNotification(
                            seller,
                            "AUCTION_IMMEDIATE_BUY",
                            String.format("[%s] 경매가 즉시구매로 낙찰되었습니다.", item.getTitle()),
                            item.getId()
                    )
            );

            return auctionItemRepository.save(item);
        }

        // ✅ 7️⃣ 기존 입찰 확인 (재입찰 여부)
        Optional<AuctionBid> existingBidOpt = auctionBidRepository.findByAuctionItemIdAndUserId(item.getId(), userId);

        if (existingBidOpt.isPresent()) {
            AuctionBid existingBid = existingBidOpt.get();
            int refundAmount = existingBid.getBidPrice();

            // ✅ 이전 입찰금 환불
            int refundedBalance = user.getPoints() + refundAmount;
            user.setPoints(refundedBalance);
            userRepository.save(user);

            pointHistoryRepository.save(PointHistory.builder()
                    .user(user)
                    .amount(refundAmount)
                    .balance(refundedBalance)
                    .type("AUCTION_REFUND")
                    .description("이전 입찰금 환불 (재입찰)")
                    .build());
        }

        // 8️⃣ 포인트 충분한지 확인
        if (user.getPoints() < bidPrice) {
            throw new IllegalStateException("보유 포인트가 부족합니다.");
        }

        // 9️⃣ 현재가보다 높은 금액인지 검증
        if (bidPrice <= item.getCurrentPrice()) {
            throw new IllegalStateException("현재가보다 높은 금액으로만 입찰할 수 있습니다.");
        }

        // ✅ 10️⃣ 새 입찰금 차감
        int newBalance = user.getPoints() - bidPrice;
        user.setPoints(newBalance);
        userRepository.save(user);

        pointHistoryRepository.save(PointHistory.builder()
                .user(user)
                .amount(-bidPrice)
                .balance(newBalance)
                .type("AUCTION_BID")
                .description("경매 입찰 참여 (임시 차감)")
                .build());

        // ✅ 11️⃣ 입찰 정보 저장 (기존 존재 시 업데이트)
        AuctionBid bid = existingBidOpt.orElse(
                AuctionBid.builder()
                        .auctionItemId(item.getId())
                        .userId(userId)
                        .bidderName(user.getNickname())
                        .createdAt(LocalDateTime.now())
                        .build()
        );
        bid.setBidPrice(bidPrice);
        bid.setCreatedAt(LocalDateTime.now());
        auctionBidRepository.save(bid);

        // 12️⃣ 이전 입찰자 목록 (본인 제외)
        List<Long> prevBidderIds = auctionBidRepository.findDistinctUserIdsByAuctionItemId(item.getId());
        prevBidderIds.remove(userId);

        // 13️⃣ 알림 메시지
        String alertMessage = String.format(
                "📢 [%s] 경매에서 %s님이 %s원으로 새로운 최고가를 달성했습니다.",
                item.getTitle(),
                user.getNickname(),
                String.format("%,d", bidPrice)
        );

        // 14️⃣ 다른 입찰자에게 알림 전송
        for (Long prevId : prevBidderIds) {
            userRepository.findById(prevId).ifPresent(prevUser -> {
                try {
                    notificationService.sendNotification(
                            prevUser,
                            "AUCTION_BID_OUTBID",
                            alertMessage,
                            item.getId()
                    );
                } catch (Exception e) {
                    System.err.println("⚠️ Notification 전송 실패 (userId=" + prevId + "): " + e.getMessage());
                }
            });
        }

        // 15️⃣ 경매 상태 갱신
        item.setCurrentPrice(bidPrice);
        item.setBidCount(item.getBidCount() + 1);

        return auctionItemRepository.save(item);
    }
}
