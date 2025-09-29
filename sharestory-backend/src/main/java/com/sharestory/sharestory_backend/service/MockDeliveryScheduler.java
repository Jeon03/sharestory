package com.sharestory.sharestory_backend.service;


import com.sharestory.sharestory_backend.domain.Order;
import com.sharestory.sharestory_backend.domain.TrackingHistory;
import com.sharestory.sharestory_backend.dto.OrderStatus;
import com.sharestory.sharestory_backend.dto.StatusMapper;
import com.sharestory.sharestory_backend.repo.OrderRepository;
import com.sharestory.sharestory_backend.repo.TrackingHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class MockDeliveryScheduler {

    private final OrderRepository orderRepository;
    private final TrackingHistoryRepository historyRepository;

    @Scheduled(fixedRate = 5000)
//    @Scheduled(fixedRate = 60000) // 1분마다 실행
    @Transactional
    public void progressMockDelivery() {
        // 1. SAFE_DELIVERY → SAFE_DELIVERY_START
        List<Order> readyOrders = orderRepository.findByStatus(OrderStatus.SAFE_DELIVERY);
        for (Order order : readyOrders) {
            order.setStatus(OrderStatus.SAFE_DELIVERY_START);
            order.getItem().setStatus(StatusMapper.toItemStatus(OrderStatus.SAFE_DELIVERY_START));

            historyRepository.save(TrackingHistory.builder()
                    .order(order)
                    .statusText("배송 시작")
                    .timestamp(LocalDateTime.now())
                    .build());
        }

        // 2. SAFE_DELIVERY_START → SAFE_DELIVERY_ING
        List<Order> startOrders = orderRepository.findByStatus(OrderStatus.SAFE_DELIVERY_START);
        for (Order order : startOrders) {
            order.setStatus(OrderStatus.SAFE_DELIVERY_ING);
            order.getItem().setStatus(StatusMapper.toItemStatus(OrderStatus.SAFE_DELIVERY_ING));

            historyRepository.save(TrackingHistory.builder()
                    .order(order)
                    .statusText("배송중")
                    .timestamp(LocalDateTime.now())
                    .build());
        }

        // 3. SAFE_DELIVERY_ING → SAFE_DELIVERY_COMPLETE
        List<Order> ingOrders = orderRepository.findByStatus(OrderStatus.SAFE_DELIVERY_ING);
        for (Order order : ingOrders) {
            order.setStatus(OrderStatus.SAFE_DELIVERY_COMPLETE);
            order.getItem().setStatus(StatusMapper.toItemStatus(OrderStatus.SAFE_DELIVERY_COMPLETE));

            historyRepository.save(TrackingHistory.builder()
                    .order(order)
                    .statusText("배송완료")
                    .timestamp(LocalDateTime.now())
                    .build());
        }
    }
}
