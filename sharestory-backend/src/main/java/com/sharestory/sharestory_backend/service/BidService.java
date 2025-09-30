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
import java.util.Map;
import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
public class BidService {

    // ✅ 기존 의존성
    private final BidRepository bidRepository;
    private final UserRepository userRepository;
    private final AuctionItemService auctionItemService;
    private final AuctionItemRepository auctionItemRepository; // item 저장을 위해 추가

    // ✅ 알림 전송을 위해 새로 추가된 의존성
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

        // ✅ 알림을 보내기 위해 판매자와 이전 최고 입찰자 정보를 미리 저장
        User seller = item.getSeller();
        User previousHighestBidder = item.getHighestBidder();

        // --- 기존 입찰 유효성 검증 로직 ---
        if (seller.getId().equals(memberId)) {
            // 주석 처리된 로직은 그대로 둡니다.
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
        auctionItemRepository.save(item); // item 상태 변경 저장

        bidder.setCurrentTotalBidPrice(newTotalBid);
        userRepository.save(bidder);

        log.info("입찰 성공 및 DB 업데이트 완료: itemId={}, newHighestBidderId={}", itemId, memberId);

        // ✅ --- 알림 전송 로직 ---
        // 1. 판매자에게 알림 전송
        notifyUser(seller, "새로운 입찰 알림!", "'" + item.getTitle() + "' 상품에 새로운 입찰이 있습니다.");

        // 2. 이전 최고 입찰자에게 상위 입찰 알림 전송 (이전 입찰자가 있고, 현재 입찰자와 다른 경우)
        if (previousHighestBidder != null && !previousHighestBidder.getId().equals(bidder.getId())) {
            notifyUser(previousHighestBidder, "상위 입찰 발생", "'" + item.getTitle() + "' 상품에 더 높은 가격의 입찰이 발생했습니다.");
        }
        // --- 알림 전송 종료 ---

        return new BidResult(true, "입찰에 성공했습니다.");
    }

    /**
     * 지정된 사용자에게 SSE와 FCM 알림을 모두 보내는 헬퍼 메서드입니다.
     */
    private void notifyUser(User user, String title, String body) {
        if (user == null) {
            log.warn("알림을 보낼 사용자(user)가 null입니다.");
            return;
        }

        Long userId = user.getId();
        log.info("알림 전송 시도: userId={}, title={}", userId, title);

        // SSE 알림 (현재 접속 중인 사용자 대상)
// Map 객체를 만들어 보냄 (이 Map이 JSON으로 변환됨)
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("message", "'test' 상품에 더 높은 가격의 입찰이 발생했습니다.");
        eventData.put("newHighestBid", 56000); // 예시: 실제 새로운 입찰가
        eventData.put("newBidderName", "새로운입찰자"); // 예시: 실제 입찰자 닉네임

        sseService.sendNotification(userId, "new-activity", eventData);
        // FCM 푸시 알림 (앱/웹을 사용하지 않는 사용자 대상)
        fcmTokenRepository.findFirstByUserId(userId).ifPresent(fcmToken -> {
            fcmUtil.send(fcmToken.getToken(), title, body);
        });
    }

    // 기존 BidResult 클래스는 그대로 유지
    public static class BidResult {
        public final boolean success;
        public final String message;

        public BidResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }
    }
}