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
    @Transactional
    public void progressMockDelivery() {
        // 1️SAFE_DELIVERY → SAFE_DELIVERY_START
        List<Order> readyOrders = orderRepository.findByStatus(OrderStatus.SAFE_DELIVERY);
        if (!readyOrders.isEmpty()) {
            for (Order order : readyOrders) {
                updateOrderStatus(order, OrderStatus.SAFE_DELIVERY_START, "배송 시작");
            }
            return;
        }

        // 2️SAFE_DELIVERY_START → SAFE_DELIVERY_ING
        List<Order> startOrders = orderRepository.findByStatus(OrderStatus.SAFE_DELIVERY_START);
        if (!startOrders.isEmpty()) {
            for (Order order : startOrders) {
                updateOrderStatus(order, OrderStatus.SAFE_DELIVERY_ING, "배송중");
            }
            return;
        }

        // 3️SAFE_DELIVERY_ING → SAFE_DELIVERY_COMPLETE
        List<Order> ingOrders = orderRepository.findByStatus(OrderStatus.SAFE_DELIVERY_ING);
        if (!ingOrders.isEmpty()) {
            for (Order order : ingOrders) {
                updateOrderStatus(order, OrderStatus.SAFE_DELIVERY_COMPLETE, "배송완료");
            }
        }
    }

    private void updateOrderStatus(Order order, OrderStatus newStatus, String statusText) {
        order.setStatus(newStatus);
        order.getItem().setStatus(StatusMapper.toItemStatus(newStatus));

        TrackingHistory history = historyRepository.save(
                TrackingHistory.builder()
                        .order(order)
                        .statusText(statusText)
                        .timestamp(LocalDateTime.now())
                        .build()
        );

    }
}

