package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.Order;
import com.sharestory.sharestory_backend.domain.TrackingHistory;
import com.sharestory.sharestory_backend.dto.OrderStatus;
import com.sharestory.sharestory_backend.dto.StatusMapper;
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
public class MockDeliveryScheduler {

    private final OrderRepository orderRepository;
    private final TrackingHistoryRepository historyRepository;
    private final NotificationTemplateService notificationTemplateService;
    private final ChatService chatService;

    /**
     * Mock 배송 단계 시뮬레이션
     * 5초마다 자동으로 다음 단계로 전환
     */
    @Scheduled(fixedRate = 5000)
    @Transactional
    public void progressMockDelivery() {
        // 1️⃣ SAFE_DELIVERY → SAFE_DELIVERY_START
        List<Order> readyOrders = orderRepository.findByStatus(OrderStatus.SAFE_DELIVERY)
                .stream()
                .filter(o -> o.getAuctionItem() == null)
                .toList();
        if (!readyOrders.isEmpty()) {
            for (Order order : readyOrders) {
                updateOrderStatus(order, OrderStatus.SAFE_DELIVERY_START, "배송 시작");
                log.info("🚚 배송 시작 → orderId={}", order.getId());

                //배송 시작 메일 발송 (구매자 + 판매자)
                try {
                    notificationTemplateService.sendSafeTradeMail(order, OrderStatus.SAFE_DELIVERY_START);
                    log.info("✅ 배송 시작 메일 발송 완료 → orderId={}", order.getId());
                } catch (Exception e) {
                    log.error("❌ 배송 시작 메일 발송 실패 → orderId={}, error={}", order.getId(), e.getMessage());
                }

                // 💬 시스템 메시지 전송
                try {
                    chatService.sendSystemMessage(order.getItem().getId(), "🚚 상품의 배송이 시작되었습니다.");
                } catch (Exception e) {
                    log.error("❌ 시스템 메시지 전송 실패 (배송 시작) → orderId={}, error={}", order.getId(), e.getMessage());
                }
            }
            return;
        }

        // 2️⃣ SAFE_DELIVERY_START → SAFE_DELIVERY_ING
        List<Order> startOrders = orderRepository.findByStatus(OrderStatus.SAFE_DELIVERY_START)
                .stream()
                .filter(o -> o.getAuctionItem() == null)
                .toList();
        if (!startOrders.isEmpty()) {
            for (Order order : startOrders) {
                updateOrderStatus(order, OrderStatus.SAFE_DELIVERY_ING, "배송 중");
                log.info("배송 중 → orderId={}", order.getId());
            }
            return;
        }

        // 3️⃣ SAFE_DELIVERY_ING → SAFE_DELIVERY_COMPLETE
        List<Order> ingOrders = orderRepository.findByStatus(OrderStatus.SAFE_DELIVERY_ING)
                .stream()
                .filter(o -> o.getAuctionItem() == null)
                .toList();
        if (!ingOrders.isEmpty()) {
            for (Order order : ingOrders) {
                updateOrderStatus(order, OrderStatus.SAFE_DELIVERY_COMPLETE, "배송 완료");
                log.info("배송 완료 → orderId={}", order.getId());

                // ✅ 배송 완료 시 메일 발송
                try {
                    notificationTemplateService.sendSafeTradeMail(order, OrderStatus.SAFE_DELIVERY_COMPLETE);
                    log.info("✅ 배송 완료 메일 발송 완료 → orderId={}", order.getId());
                } catch (Exception e) {
                    log.error("❌ 배송 완료 메일 발송 실패 → orderId={}, error={}", order.getId(), e.getMessage());
                }

                // 💬 시스템 메시지 전송
                try {
                    chatService.sendSystemMessage(order.getItem().getId(), "📦 상품이 배송 완료되었습니다.");
                } catch (Exception e) {
                    log.error("❌ 시스템 메시지 전송 실패 (배송 완료) → orderId={}, error={}", order.getId(), e.getMessage());
                }
            }
        }
    }

    private void updateOrderStatus(Order order, OrderStatus newStatus, String statusText) {
        order.setStatus(newStatus);
        order.getItem().setStatus(StatusMapper.toItemStatus(newStatus));

        // 배송 이력 추가
        historyRepository.save(
                TrackingHistory.builder()
                        .order(order)
                        .statusText(statusText)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }
}
