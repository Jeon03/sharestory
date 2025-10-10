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

        // 1️⃣ 경매 조회 (락)
        AuctionItem item = auctionItemRepository.findByIdForUpdate(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("경매를 찾을 수 없습니다."));

        // 2️⃣ 사용자 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 3️⃣ 종료 여부 검증
        if (item.getEndDateTime().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("이미 종료된 경매입니다.");
        }

        // 4️⃣ 자기 입찰 금지
        if (item.getSellerId().equals(userId)) {
            throw new IllegalStateException("자신의 상품에는 입찰할 수 없습니다.");
        }

        // 5️⃣ 최소 입찰 금액 확인
        int minBid = item.getCurrentPrice() + item.getBidUnit();
        if (bidPrice < minBid) {
            throw new IllegalArgumentException("입찰 금액은 최소 " + minBid + "원 이상이어야 합니다.");
        }

        // 6️⃣ 즉시 구매 처리
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
                    .description("경매 즉시구매")
                    .build());

            item.setCurrentPrice(item.getImmediatePrice());
            item.setEndDateTime(LocalDateTime.now());
            item.setBidCount(item.getBidCount() + 1);

            // ✅ 즉시구매 알림 (판매자에게)
            userRepository.findById(item.getSellerId()).ifPresent(seller -> {
                notificationService.sendNotification(
                        seller,
                        "AUCTION_IMMEDIATE_BUY",
                        String.format("[%s] 경매가 즉시구매로 낙찰되었습니다.", item.getTitle()),
                        item.getId()
                );
            });

            return auctionItemRepository.save(item);
        }

        // 7️⃣ 포인트 검증
        if (user.getPoints() < bidPrice) {
            throw new IllegalStateException("보유 포인트가 부족합니다.");
        }

        // 8️⃣ 현재가보다 높은 금액만 허용
        if (bidPrice <= item.getCurrentPrice()) {
            throw new IllegalStateException("현재가보다 높은 금액으로만 입찰할 수 있습니다.");
        }

        // 9️⃣ 포인트 임시 차감
        int newBalance = user.getPoints() - bidPrice;
        user.setPoints(newBalance);
        userRepository.save(user);

        // 10️⃣ 포인트 내역 기록
        pointHistoryRepository.save(PointHistory.builder()
                .user(user)
                .amount(-bidPrice)
                .balance(newBalance)
                .type("AUCTION_BID")
                .description("경매 입찰 참여 (임시 차감)")
                .build());

        // 11️⃣ 입찰 내역 저장
        AuctionBid bid = AuctionBid.builder()
                .auctionItemId(item.getId())
                .userId(userId)
                .bidderName(user.getNickname())
                .bidPrice(bidPrice)
                .createdAt(LocalDateTime.now())
                .build();
        auctionBidRepository.save(bid);

        // 12️⃣ 이전 입찰자 목록 조회 (본인 제외)
        List<Long> prevBidderIds = auctionBidRepository.findDistinctUserIdsByAuctionItemId(item.getId());
        prevBidderIds.remove(userId);

        // 13️⃣ 알림 메시지 구성
        String alertMessage = String.format(
                "📢 [%s] 경매에서 %s님이 %s원으로 새로운 최고가를 달성했습니다.",
                item.getTitle(),
                user.getNickname(),
                String.format("%,d", bidPrice)
        );

        // 14️⃣ 기존 입찰자들에게 알림(NotificationService)
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

        // 15️⃣ 상품 정보 갱신
        item.setCurrentPrice(bidPrice);
        item.setBidCount(item.getBidCount() + 1);

        return auctionItemRepository.save(item);
    }
}
