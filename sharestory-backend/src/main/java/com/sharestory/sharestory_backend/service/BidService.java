package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.domain.BidEntity;
import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.dto.BidRequestDto;
import com.sharestory.sharestory_backend.fcm.FCMUtil;
import com.sharestory.sharestory_backend.fcm.FcmTokenRepository;
import com.sharestory.sharestory_backend.fcm.SseService;
import com.sharestory.sharestory_backend.repo.AuctionItemRepository;
import com.sharestory.sharestory_backend.repo.BidRepository;
import com.sharestory.sharestory_backend.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List; // List 임포트 확인
import java.util.Map;
import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
public class BidService {

    private final BidRepository bidRepository;
    private final UserRepository userRepository;
    private final AuctionItemService auctionItemService;
    private final AuctionItemRepository auctionItemRepository;

    private final FcmTokenRepository fcmTokenRepository;
    private final SseService sseService;
    private final FCMUtil fcmUtil;

    @Transactional
    public BidResult placeBid(Long itemId, BidRequestDto dto, Long memberId) {
        log.info("입찰 처리 시작: itemId={}, memberId={}", itemId, memberId);
        int bidPrice = dto.getBidPrice();

        AuctionItem item = auctionItemService.getItemDetail(itemId);
        User bidder = userRepository.findById(memberId)
                .orElseThrow(() -> new NoSuchElementException("회원 정보를 찾을 수 없습니다. ID: " + memberId));

        // ✅ 알림을 보낼 판매자 정보만 미리 저장
        User seller = item.getSeller();

        // --- 기존 입찰 유효성 검증 로직 ---
        if (seller.getId().equals(memberId)) {
            // return new BidResult(false, "자신의 상품에는 입찰할 수 없습니다.");
        }

        if (LocalDateTime.now().isAfter(item.getAuctionEnd())) {
            return new BidResult(false, "이미 종료된 경매입니다.");
        }

        int currentMaxBid = bidRepository.findMaxBidPriceByAuctionItemId(itemId)
                .map(BigDecimal::intValue)
                .orElse(item.getMinPrice());

        if (bidPrice <= currentMaxBid) {
            return new BidResult(false, "입찰가는 현재 최고가(" + currentMaxBid + "원)보다 높아야 합니다.");
        }

        int previousBidPrice = bidRepository.findHighestBidPriceByUserAndItem(bidder.getId(), item.getId())
                .map(BigDecimal::intValue)
                .orElse(0);

        int newTotalBid = bidder.getCurrentTotalBidPrice() - previousBidPrice + bidPrice;

        if (newTotalBid > bidder.getPoints()) {
            return new BidResult(false, "총 입찰금액이 보유 포인트를 초과하여 입찰할 수 없습니다.");
        }
        // --- 유효성 검증 종료 ---

        // --- 데이터베이스 업데이트 로직 ---
        BidEntity newBid = BidEntity.builder()
                .bidder(bidder)
                .auctionItem(item)
                .bidPrice(bidPrice)
                .bidTime(LocalDateTime.now())
                .build();
        bidRepository.save(newBid);

        item.setHighestBidder(bidder);
        item.setFinalBidPrice(bidPrice);
        item.setBidCount(item.getBidCount() + 1);

        if (item.isBuyNowAvailable() && item.getReservePrice() != null && bidPrice >= item.getReservePrice()) {
            item.setBuyNowAvailable(false);
            log.info("최저가 도달. 즉시구매 비활성화: itemId={}", item.getId());
        }

        auctionItemRepository.save(item);

        bidder.setCurrentTotalBidPrice(newTotalBid);
        userRepository.save(bidder);

        log.info("입찰 성공 및 DB 업데이트 완료: itemId={}, newHighestBidderId={}", itemId, memberId);

        // ✅ --- [수정된 알림 전송 로직] ---
        // 1. 판매자에게 알림 전송
        notifyUser(seller, "새로운 입찰 알림!", "'" + item.getTitle() + "' 상품에 새로운 입찰이 있습니다.");

        // 2. 현재 입찰자를 제외한 모든 이전 입찰자들에게 상위 입찰 알림 전송
        List<User> previousBidders = bidRepository.findDistinctBiddersByAuctionItemExceptCurrent(itemId, memberId);
        log.info("이전 입찰자 {}명에게 상위 입찰 알림을 전송합니다.", previousBidders.size());
        for (User previousBidder : previousBidders) {
            notifyUser(previousBidder, "상위 입찰 발생", "'" + item.getTitle() + "' 상품에 더 높은 가격의 입찰이 발생했습니다.");
        }
        // --- 알림 전송 종료 ---

        return new BidResult(true, "입찰에 성공했습니다.");
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