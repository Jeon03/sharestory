package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.domain.Order;
import com.sharestory.sharestory_backend.domain.TrackingHistory;
import com.sharestory.sharestory_backend.dto.AuctionStatusMapper;
import com.sharestory.sharestory_backend.dto.OrderStatus;
import com.sharestory.sharestory_backend.repo.AuctionItemRepository;
import com.sharestory.sharestory_backend.repo.OrderRepository;
import com.sharestory.sharestory_backend.repo.TrackingHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class MockAuctionDeliveryScheduler {

    private final OrderRepository orderRepository;
    private final AuctionItemRepository auctionItemRepository;
    private final TrackingHistoryRepository historyRepository;
    private final NotificationTemplateService notificationTemplateService;
    private final ChatService chatService;

    /**
     * ⚙️ Mock 경매 배송 단계 시뮬레이터
     * 5초마다 자동으로 한 단계씩 전환
     */
    @Scheduled(fixedRate = 10000)
    @Transactional
    public void progressMockAuctionDelivery() {
        // 1️⃣ SAFE_DELIVERY_START → SAFE_DELIVERY_ING
        List<Order> startOrders = orderRepository.findByStatus(OrderStatus.SAFE_DELIVERY_START)
                .stream()
                .filter(o -> o.getAuctionItem() != null) // ✅ 경매 주문만 필터링
                .toList();

        if (!startOrders.isEmpty()) {
            for (Order order : startOrders) {
                updateAuctionOrderStatus(order, OrderStatus.SAFE_DELIVERY_ING, "배송 중");
                log.info("📦 경매 배송 중 → orderId={}", order.getId());

                // ✅ 메일 발송
                try {
                    notificationTemplateService.sendAuctionTradeMail(order, OrderStatus.SAFE_DELIVERY_START);
                    log.info("✅ [메일] 경매 배송 시작 알림 발송 완료 → orderId={}", order.getId());
                } catch (Exception e) {
                    log.error("❌ [메일 실패] 경매 배송 시작 알림 실패 → orderId={}, error={}", order.getId(), e.getMessage());
                }

                // ✅ 시스템 메시지 전송 (채팅방)
                try {
                    chatService.sendSystemMessageForAuction(
                            order.getAuctionItem().getId(),
                            "📦 경매 상품의 배송이 시작되었습니다."
                    );
                    log.info("✅ [시스템 메시지] 경매 배송 시작 메시지 전송 완료 → auctionId={}", order.getAuctionItem().getId());
                } catch (Exception e) {
                    log.error("❌ [시스템 메시지 실패] 경매 배송 시작 알림 실패 → auctionId={}, error={}", order.getAuctionItem().getId(), e.getMessage());
                }
            }
            return;
        }

        // 2️⃣ SAFE_DELIVERY_ING → SAFE_DELIVERY_COMPLETE
        List<Order> ingOrders = orderRepository.findByStatus(OrderStatus.SAFE_DELIVERY_ING)
                .stream()
                .filter(o -> o.getAuctionItem() != null)
                .toList();

        if (!ingOrders.isEmpty()) {
            for (Order order : ingOrders) {
                updateAuctionOrderStatus(order, OrderStatus.SAFE_DELIVERY_COMPLETE, "배송 완료");
                log.info("✅ 경매 배송 완료 → orderId={}", order.getId());

                // ✅ 메일 발송
                try {
                    notificationTemplateService.sendAuctionTradeMail(order, OrderStatus.SAFE_DELIVERY_COMPLETE);
                    log.info("✅ [메일] 경매 배송 완료 알림 발송 완료 → orderId={}", order.getId());
                } catch (Exception e) {
                    log.error("❌ [메일 실패] 경매 배송 완료 알림 실패 → orderId={}, error={}", order.getId(), e.getMessage());
                }

                // ✅ 시스템 메시지 전송
                try {
                    chatService.sendSystemMessageForAuction(
                            order.getAuctionItem().getId(),
                            "배송이 완료되었습니다.\n📦 물품을 수령하면 수령완료 버튼을 눌러주세요."
                    );
                    log.info("✅ [시스템 메시지] 경매 배송 완료 메시지 전송 완료 → auctionId={}", order.getAuctionItem().getId());
                } catch (Exception e) {
                    log.error("❌ [시스템 메시지 실패] 경매 배송 완료 알림 실패 → auctionId={}, error={}", order.getAuctionItem().getId(), e.getMessage());
                }
            }
        }
    }

    /**
     * ✅ 경매 주문 상태 업데이트 + AuctionItem 동기화 + 배송 이력 기록
     */
    private void updateAuctionOrderStatus(Order order, OrderStatus newStatus, String historyText) {
        order.setStatus(newStatus);

        AuctionItem auctionItem = order.getAuctionItem();
        if (auctionItem != null) {
            auctionItem.setStatus(AuctionStatusMapper.toAuctionStatus(newStatus));
            auctionItemRepository.save(auctionItem);
        }

        historyRepository.save(
                TrackingHistory.builder()
                        .order(order)
                        .statusText(historyText)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }
}
