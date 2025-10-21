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
    private final OrderService orderService;

    @Transactional
    public AuctionItem placeBid(Long auctionId, Long userId, int bidPrice) {

        //경매 조회 (for update lock)
        AuctionItem item = auctionItemRepository.findByIdForUpdate(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("경매를 찾을 수 없습니다."));

        //사용자 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        //종료 여부 확인
        if (item.getEndDateTime().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("이미 종료된 경매입니다.");
        }

        //자기 자신 입찰 금지
        if (item.getSellerId().equals(userId)) {
            throw new IllegalStateException("자신의 상품에는 입찰할 수 없습니다.");
        }

        //최소 입찰 금액 확인
        int minBid = item.getCurrentPrice() + item.getBidUnit();
        if (bidPrice < minBid) {
            throw new IllegalArgumentException("입찰 금액은 최소 " + minBid + "원 이상이어야 합니다.");
        }

        //즉시구매가보다 높은 입찰은 금지 (프론트에서 별도 confirm으로 유도)
        if (item.getImmediatePrice() != null && bidPrice >= item.getImmediatePrice()) {
            throw new IllegalStateException(
                    String.format("입찰 금액이 즉시구매가(%,d원)를 초과합니다. 즉시구매를 이용해주세요.", item.getImmediatePrice())
            );
        }

        //기존 입찰 확인 (재입찰 여부)
        Optional<AuctionBid> existingBidOpt = auctionBidRepository.findByAuctionItemIdAndUserId(item.getId(), userId);

        if (existingBidOpt.isPresent()) {
            AuctionBid existingBid = existingBidOpt.get();
            int refundAmount = existingBid.getBidPrice();
            //이전 입찰금 환불
            int refundedBalance = user.getPoints() + refundAmount;
            user.setPoints(refundedBalance);
            userRepository.save(user);

            pointHistoryRepository.save(PointHistory.builder()
                    .user(user)
                    .amount(refundAmount)
                    .balance(refundedBalance)
                    .type("AUCTION_REFUND")
                    .description(String.format("[%s] 이전 입찰금 환불 (재입찰)", item.getTitle()))
                    .build());
        }

        //포인트 충분한지 확인
        if (user.getPoints() < bidPrice) {
            throw new IllegalStateException("보유 포인트가 부족합니다.");
        }

        //현재가보다 높은 금액인지 검증
        if (bidPrice <= item.getCurrentPrice()) {
            throw new IllegalStateException("현재가보다 높은 금액으로만 입찰할 수 있습니다.");
        }

        //새 입찰금 차감
        int newBalance = user.getPoints() - bidPrice;
        user.setPoints(newBalance);
        userRepository.save(user);

        pointHistoryRepository.save(PointHistory.builder()
                .user(user)
                .amount(-bidPrice)
                .balance(newBalance)
                .type("AUCTION_BID")
                .description(String.format("[%s] 경매 입찰 참여", item.getTitle()))
                .build());

        //입찰 정보 저장 (기존 존재 시 업데이트)
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

        //이전 입찰자 목록 (본인 제외)
        List<Long> prevBidderIds = auctionBidRepository.findDistinctUserIdsByAuctionItemId(item.getId());
        prevBidderIds.remove(userId);

        //알림 메시지
        String alertMessage = String.format(
                "📢 [%s] 경매에서 %s님이 %s원으로 새로운 최고가를 달성했습니다.",
                item.getTitle(),
                user.getNickname(),
                String.format("%,d", bidPrice)
        );

        //다른 입찰자에게 알림 전송
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

        //경매 상태 갱신
        item.setCurrentPrice(bidPrice);
        item.setBidCount(item.getBidCount() + 1);

        return auctionItemRepository.save(item);
    }

    @Transactional
    public AuctionItem buyNow(Long auctionId, Long buyerId) {
        AuctionItem item = auctionItemRepository.findByIdForUpdate(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("경매를 찾을 수 없습니다."));

        if (item.getEndDateTime().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("이미 종료된 경매입니다.");
        }

        if (item.getImmediatePrice() == null || item.getImmediatePrice() <= 0) {
            throw new IllegalStateException("즉시구매가 설정되지 않은 상품입니다.");
        }

        if (item.getSellerId().equals(buyerId)) {
            throw new IllegalStateException("자신의 상품은 구매할 수 없습니다.");
        }

        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        //포인트 부족 확인
        if (buyer.getPoints() < item.getImmediatePrice()) {
            throw new IllegalStateException("보유 포인트가 부족합니다.");
        }

        //즉시구매자의 기존 입찰금 환불
        auctionBidRepository.findByAuctionItemIdAndUserId(item.getId(), buyerId)
                .ifPresent(existingBid -> {
                    int refundAmount = existingBid.getBidPrice();
                    if (refundAmount > 0) {
                        int newBalance = buyer.getPoints() + refundAmount;
                        buyer.setPoints(newBalance);
                        userRepository.save(buyer);

                        pointHistoryRepository.save(PointHistory.builder()
                                .user(buyer)
                                .amount(refundAmount)
                                .balance(newBalance)
                                .type("AUCTION_REFUND")
                                .description(String.format("[%s] 즉시구매로 본인 입찰금 환불", item.getTitle()))
                                .build());
                    }
                });

        //기존 입찰자 환불 처리
        List<AuctionBid> existingBids = auctionBidRepository.findByAuctionItemId(item.getId());
        for (AuctionBid prevBid : existingBids) {
            if (!prevBid.getUserId().equals(buyerId)) { // 즉시구매자 제외
                userRepository.findById(prevBid.getUserId()).ifPresent(prevUser -> {
                    int refundAmount = prevBid.getBidPrice();
                    int newBalance = prevUser.getPoints() + refundAmount;
                    prevUser.setPoints(newBalance);
                    userRepository.save(prevUser);

                    pointHistoryRepository.save(PointHistory.builder()
                            .user(prevUser)
                            .amount(refundAmount)
                            .balance(newBalance)
                            .type("AUCTION_REFUND")
                            .description(String.format("[%s] 경매 즉시구매로 기존 입찰금 환불", item.getTitle()))
                            .build());

                    //알림 전송
                    try {
                        notificationService.sendNotification(
                                prevUser,
                                "AUCTION_REFUND",
                                String.format("[%s] 경매가 즉시구매로 종료되어 입찰금이 환불되었습니다.", item.getTitle()),
                                item.getId()
                        );
                    } catch (Exception e) {
                        System.err.println("⚠️ 알림 전송 실패: " + e.getMessage());
                    }
                });
            }
        }

        //포인트 차감 및 히스토리 기록
        int newBalance = buyer.getPoints() - item.getImmediatePrice();
        buyer.setPoints(newBalance);
        userRepository.save(buyer);

        pointHistoryRepository.save(PointHistory.builder()
                .user(buyer)
                .amount(-item.getImmediatePrice())
                .balance(newBalance)
                .type("AUCTION_IMMEDIATE_BUY")
                .description(String.format("[%s] 경매 즉시구매", item.getTitle()))
                .build());

        AuctionBid buyNowBid = AuctionBid.builder()
                .auctionItemId(item.getId())
                .userId(buyerId)
                .bidPrice(item.getImmediatePrice())
                .bidderName(buyer.getNickname())
                .createdAt(LocalDateTime.now())
                .build();
        auctionBidRepository.save(buyNowBid);

        //경매 상태 업데이트
        item.setWinnerId(buyerId);
        item.setWinningPrice(item.getImmediatePrice());
        item.setCurrentPrice(item.getImmediatePrice());
        item.setEndDateTime(LocalDateTime.now()); // 경매 종료
        item.setBidCount(item.getBidCount() + 1);
        item.setStatus(com.sharestory.sharestory_backend.dto.AuctionStatus.TRADE_PENDING);
        auctionItemRepository.save(item);

        //안전거래(Order) 자동 생성
        try {
            System.out.println("[즉시구매] 안전거래(Order) 생성 시도...");
            orderService.createSafeOrderFromAuction(item);
            System.out.println("[즉시구매] Order 생성 완료");
        } catch (Exception e) {
            System.err.println("[즉시구매] Order 생성 실패: " + e.getMessage());
            e.printStackTrace();
        }


        //판매자 알림
        userRepository.findById(item.getSellerId()).ifPresent(seller -> {
            notificationService.sendNotification(
                    seller,
                    "AUCTION_IMMEDIATE_BUY",
                    String.format("[%s] 경매 상품이 즉시구매로 낙찰되었습니다.", item.getTitle()),
                    item.getId()
            );
        });

        return item;
    }

}
