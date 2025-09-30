package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.DeliveryTracking;
import com.sharestory.sharestory_backend.domain.Item;
import com.sharestory.sharestory_backend.domain.Order;
import com.sharestory.sharestory_backend.domain.TrackingHistory;
import com.sharestory.sharestory_backend.dto.*;
import com.sharestory.sharestory_backend.repo.DeliveryTrackingRepository;
import com.sharestory.sharestory_backend.repo.ItemRepository;
import com.sharestory.sharestory_backend.repo.OrderRepository;
import com.sharestory.sharestory_backend.repo.TrackingHistoryRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class DeliveryTrackingService {

    private final ItemRepository itemRepository;
    private final OrderRepository orderRepository;
    private final DeliveryTrackingRepository trackingRepository;
    private final TrackingHistoryRepository historyRepository;

    @Transactional
    public void registerInvoice(Long orderId, Long sellerId, DeliveryInvoiceRequest req) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("주문이 존재하지 않습니다."));

        Item item = order.getItem();

        if (!item.getSellerId().equals(sellerId)) {
            throw new SecurityException("판매자만 송장을 등록할 수 있습니다.");
        }

        if (trackingRepository.existsByItem_Id(item.getId())) {
            throw new IllegalStateException("이미 송장이 등록된 상품입니다.");
        }

        // 송장 저장
        DeliveryTracking tracking = DeliveryTracking.builder()
                .courier(req.getCourier())
                .trackingNumber(req.getTrackingNumber())
                .item(item)
                .build();
        trackingRepository.save(tracking);

        // 상태 업데이트 (송장 등록됨)
        order.setStatus(com.sharestory.sharestory_backend.dto.OrderStatus.SAFE_DELIVERY);
        item.setStatus(StatusMapper.toItemStatus(order.getStatus())); // SAFE_READY

        orderRepository.save(order);
        itemRepository.save(item);
    }

    @Transactional
    public DeliveryTrackingResponse getMockTracking(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("주문이 존재하지 않습니다."));

        // ✅ 송장 정보는 DeliveryTracking 테이블에서 조회
        DeliveryTracking tracking = trackingRepository.findByItem_Id(order.getItem().getId())
                .orElseThrow(() -> new IllegalStateException("송장 정보가 없습니다."));

        // 현재 상태 → 텍스트 매핑
        String status = switch (order.getStatus()) {
            case SAFE_DELIVERY       -> "송장 등록됨";
            case SAFE_DELIVERY_START -> "배송 시작";
            case SAFE_DELIVERY_ING   -> "배송중";
            case SAFE_DELIVERY_COMPLETE -> "배송완료";
            case SAFE_DELIVERY_RECEIVED -> "배송완료";
            case SAFE_DELIVERY_FINISHED -> "배송완료";
            default -> "준비중";
        };

        //배송 이력 (스케줄러가 기록했다면 DB에서 조회, 없으면 더미)
        List<TrackingHistoryDto> history = historyRepository
                .findByOrder_IdOrderByTimestampAsc(orderId)
                .stream()
                .map(TrackingHistoryDto::new)
                .toList();

        return DeliveryTrackingResponse.builder()
                .trackingNumber(tracking.getTrackingNumber())
                .courier(tracking.getCourier())
                .status(status)
                .updatedAt(LocalDateTime.now())
                .history(history)
                .build();
    }



}
