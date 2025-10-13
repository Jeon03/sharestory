package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.*;
import com.sharestory.sharestory_backend.dto.AuctionStatus;
import com.sharestory.sharestory_backend.dto.DeliveryInfoRequest;
import com.sharestory.sharestory_backend.dto.DeliveryInvoiceRequest;
import com.sharestory.sharestory_backend.dto.OrderStatus;
import com.sharestory.sharestory_backend.repo.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AuctionOrderService {

    private final OrderRepository orderRepository;
    private final AuctionItemRepository auctionItemRepository;
    private final UserRepository userRepository;
    private final PointHistoryRepository pointHistoryRepository;
    private final DeliveryTrackingRepository trackingRepository;
    private final TrackingHistoryRepository historyRepository;
    private final NotificationTemplateService notificationTemplateService;
    private final ChatService chatService;

    /** ✅ 1. 구매자 배송정보 등록 + 결제 */
    public void saveDeliveryInfoAndPay(Long auctionId, Long buyerId, DeliveryInfoRequest req) {
        AuctionItem auctionItem = auctionItemRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("경매상품이 존재하지 않습니다."));

        if (!buyerId.equals(auctionItem.getWinnerId())) {
            throw new SecurityException("낙찰자만 배송정보를 등록할 수 있습니다.");
        }

        Order order = orderRepository.findByAuctionItemId(auctionItem.getId())
                .orElseThrow(() -> new IllegalArgumentException("주문이 존재하지 않습니다."));

        if (order.getDeliveryInfo() != null) {
            throw new IllegalStateException("이미 배송정보가 등록되었습니다.");
        }

        // ✅ 결제 금액 계산 (배송비 + 안전거래 수수료)
        int shippingFee = 3000;
        int safeFee = (int) Math.round(auctionItem.getWinningPrice() * 0.035);
        int total = shippingFee + safeFee;

        User seller = userRepository.findById(order.getSellerId())
                .orElseThrow(() -> new IllegalArgumentException("판매자 정보 없음"));
        // ✅ 포인트 차감
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new IllegalArgumentException("구매자 없음"));

        if (buyer.getPoints() < total) {
            throw new IllegalStateException("포인트가 부족합니다.");
        }

        buyer.setPoints(buyer.getPoints() - total);
        userRepository.save(buyer);

        pointHistoryRepository.save(PointHistory.builder()
                .user(buyer)
                .amount(-total)
                .balance(buyer.getPoints())
                .type("AUCTION_SAFE_PAYMENT")
                .description("경매 안전거래 결제 (배송비 + 수수료)")
                .createdAt(Instant.now())
                .build());

        // ✅ 배송정보 등록 및 상태 변경
        order.setDeliveryInfo(req.toEntity());
        order.setStatus(OrderStatus.SAFE_DELIVERY);
        order.setAuctionItem(auctionItem); // ✅ 경매상품 연결 보장
        orderRepository.save(order);

        // ✅ 경매상품 상태 업데이트 (FINISHED → TRADE_PENDING)
        auctionItem.setStatus(AuctionStatus.TRADE_PENDING);
        auctionItemRepository.save(auctionItem);

        // ✅ ① 송장등록 요청 메일 전송
        try {
            notificationTemplateService.sendAuctionTradeMail(order, OrderStatus.SAFE_DELIVERY);
            log.info("📧 [경매 메일 발송] 송장등록 요청 → seller={}", seller.getNickname());
        } catch (Exception e) {
            log.error("❌ [경매 메일 실패] 송장등록 요청 메일 실패: {}", e.getMessage());
        }

        // ✅ ② 시스템 메시지 전송
        try {
            chatService.sendSystemMessageForAuction(
                    auctionItem.getId(),
                    "📦 구매자가 결제 및 배송정보를 등록했습니다.\n" +
                            "판매자님은 송장을 등록해주세요."
            );
            log.info("💬 [시스템 메시지] 송장등록 요청 메시지 발송 완료");
        } catch (Exception e) {
            log.error("❌ 시스템 메시지 발송 실패: {}", e.getMessage());
        }

        log.info("📦 [경매 배송정보 등록 완료] OrderID={}, Buyer={}, 결제액={}", order.getId(), buyerId, total);
    }

    /** ✅ 2. 배송정보 조회 (판매자용) */
    public DeliveryInfo getDeliveryInfo(Long auctionId, Long sellerId) {
        Order order = orderRepository.findByAuctionItemId(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("주문이 존재하지 않습니다."));

        if (!order.getSellerId().equals(sellerId)) {
            throw new SecurityException("판매자만 배송정보를 조회할 수 있습니다.");
        }

        if (order.getDeliveryInfo() == null) {
            throw new IllegalStateException("배송정보가 등록되지 않았습니다.");
        }

        return order.getDeliveryInfo();
    }

    /** ✅ 3. 송장 등록 (판매자) */
    public void registerInvoice(Long auctionId, Long sellerId, DeliveryInvoiceRequest req) {
        Order order = orderRepository.findByAuctionItemId(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("주문이 존재하지 않습니다."));

        if (!order.getSellerId().equals(sellerId)) {
            throw new SecurityException("판매자만 송장을 등록할 수 있습니다.");
        }

        if (order.getDeliveryInfo() == null) {
            throw new IllegalStateException("배송정보가 먼저 등록되어야 합니다.");
        }

        if (order.getDeliveryInfo().getTrackingNumber() != null) {
            throw new IllegalStateException("이미 송장이 등록되었습니다.");
        }

        // ✅ 송장 정보 설정
        DeliveryInfo info = order.getDeliveryInfo();
        info.setCourier(req.getCourier());
        info.setTrackingNumber(req.getTrackingNumber());
        order.setDeliveryInfo(info);
        order.setStatus(OrderStatus.SAFE_DELIVERY_START);
        orderRepository.save(order);

        // ✅ 배송추적 초기화
        DeliveryTracking tracking = DeliveryTracking.builder()
                .order(order)
                .courier(req.getCourier())
                .trackingNumber(req.getTrackingNumber())
                .status("배송 준비중")
                .createdAt(LocalDateTime.now())
                .build();
        trackingRepository.save(tracking);

        historyRepository.save(TrackingHistory.builder()
                .order(order)
                .statusText("배송 준비중.")
                .timestamp(LocalDateTime.now())
                .build());

        AuctionItem auctionItem = order.getAuctionItem();
        if (auctionItem != null) {
            auctionItem.setStatus(com.sharestory.sharestory_backend.dto.AuctionStatus.TRADE_DELIVERY);
            auctionItemRepository.save(auctionItem);
        }

        // ✅ ① 구매자에게 배송 시작 메일 발송
        try {
            notificationTemplateService.sendAuctionTradeMail(order, OrderStatus.SAFE_DELIVERY_START);
            log.info("📧 [메일 발송] 경매 송장등록 → 구매자에게 배송시작 메일 전송 완료");
        } catch (Exception e) {
            log.error("❌ [메일 발송 실패] 경매 송장등록 메일 전송 실패: {}", e.getMessage());
        }

        // ✅ ② 채팅 시스템 메시지 발송 (구매자에게도 표시)
        try {
            chatService.sendSystemMessageForAuction(
                    auctionItem.getId(),
                    "🚚 판매자가 송장을 등록했습니다.\n📦 배송이 곧 시작됩니다."
            );
            log.info("💬 [시스템 메시지] 경매 송장등록 알림 전송 완료 → auctionId={}", auctionItem.getId());
        } catch (Exception e) {
            log.error("❌ [시스템 메시지 실패] 경매 송장등록 알림 실패: {}", e.getMessage());
        }

        log.info("🚚 [경매 송장 등록 완료] OrderID={}, Courier={}, Tracking={}",
                order.getId(), req.getCourier(), req.getTrackingNumber());

    }



    @Transactional
    public void confirmReceipt(Long auctionId, Long buyerId) {
        AuctionItem auction = auctionItemRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("해당 경매 상품이 존재하지 않습니다."));

        // ✅ 본인 낙찰 여부 확인
        if (!buyerId.equals(auction.getWinnerId())) {
            throw new SecurityException("본인 낙찰 상품만 수령 확인할 수 있습니다.");
        }

        // ✅ 현재 상태 확인
        if (auction.getStatus() != AuctionStatus.TRADE_DELIVERY_COMPLETE) {
            throw new IllegalStateException("현재 상태에서는 수령 확인을 할 수 없습니다.");
        }

        // ✅ 상태 변경
        auction.setStatus(AuctionStatus.TRADE_RECEIVED);
        auctionItemRepository.save(auction);

        Order order = orderRepository.findByAuctionItemId(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("해당 경매의 주문이 존재하지 않습니다."));
        order.setStatus(OrderStatus.SAFE_DELIVERY_RECEIVED);
        orderRepository.save(order);

        // ✅ 시스템 메시지 + FCM (경매용)
        try {
            chatService.sendSystemMessageForAuction(
                    auctionId,
                    "구매자가 수령을 확인했습니다. 판매자는 ‘포인트 수령하기’를 눌러 정산을 완료해주세요."
            );
            log.info("💬 [시스템 메시지] 경매 수령 확인 알림 전송 완료 → auctionId={}", auctionId);
        } catch (Exception e) {
            log.error("❌ [시스템 메시지 실패] 경매 수령 확인 알림 실패 → auctionId={}, err={}", auctionId, e.getMessage());
        }

    }

    @Transactional
    public void payoutToSeller(Long auctionId, Long sellerId) {
        AuctionItem auction = auctionItemRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("경매 상품이 존재하지 않습니다."));

        if (!auction.getSellerId().equals(sellerId)) {
            throw new SecurityException("판매자만 포인트를 수령할 수 있습니다.");
        }

        if (auction.getStatus() != AuctionStatus.TRADE_RECEIVED) {
            throw new IllegalStateException("포인트 수령 대기 상태가 아닙니다. (현재 상태: " + auction.getStatus() + ")");
        }

        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new IllegalArgumentException("판매자 정보가 없습니다."));

        int payoutPoint = auction.getWinningPrice();
        seller.setPoints(seller.getPoints() + payoutPoint);
        userRepository.save(seller);


        pointHistoryRepository.save(PointHistory.builder()
                .user(seller)
                .amount(payoutPoint)
                .balance(seller.getPoints())
                .type("AUCTION_PAYOUT")
                .description("경매 낙찰 상품 포인트 정산")
                .createdAt(Instant.now())
                .build());

        try {
            String message = "거래가 완료되었습니다!\n" +
                    "포인트가 판매자에게 지급되었으며, 거래가 성공적으로 종료되었습니다.";

            chatService.sendSystemMessageForAuction(auctionId, message);
            log.info("💬 [시스템 메시지 전송 완료] 경매 포인트 정산 완료 알림 → auctionId={}", auctionId);
        } catch (Exception e) {
            log.error("❌ [시스템 메시지 전송 실패] 경매 포인트 정산 알림 실패 → auctionId={}, error={}", auctionId, e.getMessage());
        }

        // 상태 업데이트
        auction.setStatus(AuctionStatus.TRADE_COMPLETE);
        auctionItemRepository.save(auction);

        log.info("💳 [경매 포인트 지급 완료] Seller={}, AuctionID={}, Amount={}", sellerId, auctionId, payoutPoint);
    }
}
