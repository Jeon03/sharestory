package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.domain.DeliveryInfo;
import com.sharestory.sharestory_backend.domain.Order;
import com.sharestory.sharestory_backend.dto.DeliveryInvoiceRequest;
import com.sharestory.sharestory_backend.dto.DeliveryTrackingResponse;
import com.sharestory.sharestory_backend.repo.OrderRepository;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import com.sharestory.sharestory_backend.service.DeliveryTrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class DeliveryTrackingController {

    private final OrderRepository orderRepository;
    private final DeliveryTrackingService deliveryTrackingService;

    //배송지 정보 조회 (송장 등록 모달용)
    @GetMapping("/{itemId}/delivery-info")
    public DeliveryInfo getDeliveryInfoByItem(@PathVariable Long itemId) {
        Order order = orderRepository.findByItem_Id(itemId)
                .orElseThrow(() -> new IllegalArgumentException("주문이 존재하지 않습니다."));
        return order.getDeliveryInfo();
    }

    // 송장 등록 (itemId 기반)
    @PostMapping("/{itemId}/delivery/invoice")
    public ResponseEntity<String> registerInvoiceByItem(
            @PathVariable Long itemId,
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody DeliveryInvoiceRequest req
    ) {
        // ✅ itemId → order 조회
        Order order = orderRepository.findByItem_Id(itemId)
                .orElseThrow(() -> new IllegalArgumentException("해당 상품의 주문이 존재하지 않습니다."));

        deliveryTrackingService.registerInvoice(order.getId(), user.getId(), req);
        return ResponseEntity.ok("송장이 등록되었습니다.");
    }


    // 🚛 배송 추적 조회 (itemId 기반)
    @GetMapping("/{itemId}/delivery/tracking")
    public ResponseEntity<DeliveryTrackingResponse> trackDeliveryByItem(@PathVariable Long itemId) {
        // ✅ itemId → order 조회
        Order order = orderRepository.findByItem_Id(itemId)
                .orElseThrow(() -> new IllegalArgumentException("해당 상품의 주문이 존재하지 않습니다."));

        DeliveryTrackingResponse tracking = deliveryTrackingService.getMockTracking(order.getId());
        return ResponseEntity.ok(tracking);
    }

    // 📊 현재 배송 상태 조회 (아이템 상태 + 주문 상태)
    @GetMapping("/{itemId}/delivery/status")
    public ResponseEntity<?> getDeliveryStatus(@PathVariable Long itemId) {
        Order order = orderRepository.findByItem_Id(itemId)
                .orElseThrow(() -> new IllegalArgumentException("해당 상품에 대한 주문이 없습니다."));
        return ResponseEntity.ok(Map.of(
                "orderStatus", order.getStatus(),
                "itemStatus", order.getItem().getStatus()
        ));
    }

}
