package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.*;
import com.sharestory.sharestory_backend.dto.*;
import com.sharestory.sharestory_backend.repo.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AuctionDeliveryTrackingService {

    private final OrderRepository orderRepository;
    private final DeliveryTrackingRepository trackingRepository;
    private final TrackingHistoryRepository historyRepository;
    private final NotificationTemplateService notificationTemplateService;
    private final AuctionItemRepository auctionItemRepository;

    /** ✅ 송장 등록 (판매자용) */
    public void registerAuctionInvoice(Long auctionId, Long sellerId, DeliveryInvoiceRequest req) {
        // 1️⃣ 경매 상품 조회
        AuctionItem auctionItem = auctionItemRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("경매상품이 존재하지 않습니다."));

        // 2️⃣ 주문 조회
        Order order = orderRepository.findByAuctionItemId(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("주문이 존재하지 않습니다."));

        // 3️⃣ 판매자 검증
        if (!order.getSellerId().equals(sellerId))
            throw new SecurityException("판매자만 송장을 등록할 수 있습니다.");

        // 4️⃣ 구매자가 배송정보 입력했는지 확인
        if (order.getDeliveryInfo() == null)
            throw new IllegalStateException("구매자가 배송정보를 등록하지 않았습니다.");

        // 5️⃣ 중복 등록 방지
        if (trackingRepository.existsByAuctionItem_Id(auctionId))
            throw new IllegalStateException("이미 송장이 등록된 경매상품입니다.");

        // 6️⃣ 송장 정보 저장
        DeliveryTracking tracking = DeliveryTracking.builder()
                .order(order)
                .auctionItem(auctionItem)
                .courier(req.getCourier())
                .trackingNumber(req.getTrackingNumber())
                .status("배송 준비중")
                .createdAt(LocalDateTime.now())
                .build();

        trackingRepository.save(tracking);

        // 7️⃣ 주문 상태 업데이트
        order.setStatus(OrderStatus.SAFE_DELIVERY_START);
        DeliveryInfo info = order.getDeliveryInfo();
        info.setCourier(req.getCourier());
        info.setTrackingNumber(req.getTrackingNumber());
        order.setDeliveryInfo(info);
        orderRepository.save(order);

        auctionItem.setStatus(AuctionStatus.TRADE_DELIVERY);
        auctionItemRepository.save(auctionItem);

        // 8️⃣ 배송 이력 기록
        historyRepository.save(TrackingHistory.builder()
                .order(order)
                .statusText("송장번호가 등록되었습니다.")
                .timestamp(LocalDateTime.now())
                .build());

        // 9️⃣ 판매자 → 구매자 알림
//        notificationTemplateService.sendSafeTradeMail(order, OrderStatus.SAFE_DELIVERY_START);
    }

    /** ✅ 배송 추적 조회 (구매자/판매자 공통) */
    @Transactional
    public DeliveryTrackingResponse getAuctionTracking(Long auctionId) {
        // 1️⃣ auctionId로 order 조회
        Order order = orderRepository.findByAuctionItemId(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("주문이 존재하지 않습니다."));

        // 2️⃣ orderId 기준으로 송장 조회
        DeliveryTracking tracking = trackingRepository.findByOrder_Id(order.getId())
                .orElseThrow(() -> new IllegalStateException("송장 정보가 없습니다."));

        // 3️⃣ 배송 이력 조회
        List<TrackingHistoryDto> history = historyRepository
                .findByOrder_IdOrderByTimestampAsc(order.getId())
                .stream()
                .map(TrackingHistoryDto::new)
                .toList();

        // 4️⃣ 상태 변환
        String status = switch (order.getStatus()) {
            case SAFE_DELIVERY_START -> "배송 시작";
            case SAFE_DELIVERY_ING -> "배송 중";
            case SAFE_DELIVERY_COMPLETE, SAFE_DELIVERY_RECEIVED, SAFE_DELIVERY_FINISHED -> "배송 완료";
            default -> "송장 등록됨";
        };

        // 5️⃣ 응답 구성
        return DeliveryTrackingResponse.builder()
                .trackingNumber(tracking.getTrackingNumber())
                .courier(tracking.getCourier())
                .status(status)
                .updatedAt(LocalDateTime.now())
                .history(history)
                .build();
    }
}
