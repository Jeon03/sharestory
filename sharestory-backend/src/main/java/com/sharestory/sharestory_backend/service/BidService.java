package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.*;
import com.sharestory.sharestory_backend.dto.BidRequestDto;
import com.sharestory.sharestory_backend.fcm.FCMUtil;
import com.sharestory.sharestory_backend.fcm.FcmTokenRepository;
import com.sharestory.sharestory_backend.fcm.SseService;
import com.sharestory.sharestory_backend.repo.AuctionItemRepository;
import com.sharestory.sharestory_backend.repo.BidDepositRepository;
import com.sharestory.sharestory_backend.repo.BidRepository;
import com.sharestory.sharestory_backend.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
public class BidService {

    private final BidRepository bidRepository;
    private final UserRepository userRepository;
    private final AuctionItemRepository auctionItemRepository;
    private final BidDepositRepository bidDepositRepository;
    private final SseService sseService;
    private final FcmTokenRepository fcmTokenRepository;
    private final FCMUtil fcmUtil;


    @Transactional
    public BidResult placeBid(Long itemId, BidRequestDto dto, Long memberId) {
        int newBidPrice = dto.getBidPrice();

        AuctionItem item = auctionItemRepository.findById(itemId)
                .orElseThrow(() -> new NoSuchElementException("경매 상품을 찾을 수 없습니다."));

        // User를 찾을 때 잠금을 사용해서 동시성 문제를 방지합니다.
        User bidder = userRepository.findByIdWithLock(memberId)
                .orElseThrow(() -> new NoSuchElementException("회원 정보를 찾을 수 없습니다."));

        // --- 입찰 유효성 검증 ---
        if (item.getSeller().getId().equals(memberId)) {
            return new BidResult(false, "자신의 상품에는 입찰할 수 없습니다.");
        }
        if (LocalDateTime.now().isAfter(item.getAuctionEnd())) {
            return new BidResult(false, "이미 종료된 경매입니다.");
        }
        int currentMaxBid = item.getFinalBidPrice();
        if (newBidPrice <= currentMaxBid) {
            return new BidResult(false, "입찰가는 현재 최고가(" + currentMaxBid + "원)보다 높아야 합니다.");
        }
        if (bidder.getCurrentTotalBidPrice() + newBidPrice > bidder.getPoints()) {
            return new BidResult(false, "보유 포인트를 초과하여 입찰할 수 없습니다.");
        }

        // 1. 이 경매에 대한 사용자의 이전 최고 입찰액(보증금)을 찾습니다.
        int previousDepositAmount = bidDepositRepository.findByUserAndAuctionItem(bidder, item)
                .map(BidDeposit::getAmount)
                .orElse(0);

        // 2. 입찰 기록(BidEntity)을 저장합니다.
        bidRepository.save(BidEntity.builder()
                .bidder(bidder)
                .auctionItem(item)
                .bidPrice(newBidPrice)
                .bidTime(LocalDateTime.now())
                .build());

        // 3. 입찰 보증금(BidDeposit)을 새 입찰액으로 갱신(UPSERT)합니다.
        BidDeposit deposit = bidDepositRepository.findByUserAndAuctionItem(bidder, item)
                .orElse(new BidDeposit(null, bidder, item, 0));
        deposit.setAmount(newBidPrice);
        bidDepositRepository.save(deposit);

        // 4. User의 currentTotalPrice를 이전 보증금과의 '차액'만큼만 업데이트합니다.
        int amountDifference = newBidPrice - previousDepositAmount;
        bidder.setCurrentTotalBidPrice(bidder.getCurrentTotalBidPrice() + amountDifference);

        // 5. User와 AuctionItem 엔티티의 나머지 정보를 업데이트하고 저장합니다.
        item.setHighestBidder(bidder);
        item.setFinalBidPrice(newBidPrice);
        item.setBidCount(item.getBidCount() + 1);

        userRepository.save(bidder);
        auctionItemRepository.save(item);

        // --- 알림 로직 ---
        notifySellerAndBidders(item, bidder);

        return new BidResult(true, "입찰에 성공했습니다.");
    }

    private void notifySellerAndBidders(AuctionItem item, User currentBidder) {
        // 1. 판매자에게 알림 전송
        notifyUser(item.getSeller(), "새로운 입찰 알림!", "'" + item.getTitle() + "' 상품에 새로운 입찰이 있습니다.");

        // 2. 현재 입찰자를 제외한 모든 이전 입찰자들에게 상위 입찰 알림 전송
        List<User> previousBidders = bidRepository.findDistinctBiddersByAuctionItemExceptCurrent(item.getId(), currentBidder.getId());
        log.info("이전 입찰자 {}명에게 상위 입찰 알림을 전송합니다.", previousBidders.size());
        for (User previousBidder : previousBidders) {
            notifyUser(previousBidder, "상위 입찰 발생", "'" + item.getTitle() + "' 상품에 더 높은 가격의 입찰이 발생했습니다.");
        }
    }

    private void notifyUser(User user, String title, String body) {
        if (user == null) {
            log.warn("알림을 보낼 사용자(user)가 null입니다.");
            return;
        }

        Long userId = user.getId();
        log.info("알림 전송 시도: userId={}, title={}", userId, title);

        Map<String, Object> eventData = new HashMap<>();
        eventData.put("message", body);

        sseService.sendNotification(userId, "new-activity", eventData);

        fcmTokenRepository.findFirstByUserId(userId).ifPresent(fcmToken -> {
            fcmUtil.send(fcmToken.getToken(), title, body);
        });
    }

    public static class BidResult {
        public final boolean success;
        public final String message;

        public BidResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }
    }
}