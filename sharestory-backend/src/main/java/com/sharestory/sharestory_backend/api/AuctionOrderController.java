package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.domain.DeliveryInfo;
import com.sharestory.sharestory_backend.domain.Order;
import com.sharestory.sharestory_backend.dto.DeliveryInfoRequest;
import com.sharestory.sharestory_backend.dto.DeliveryInvoiceRequest;
import com.sharestory.sharestory_backend.dto.DeliveryTrackingResponse;
import com.sharestory.sharestory_backend.repo.OrderRepository;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import com.sharestory.sharestory_backend.service.AuctionDeliveryTrackingService;
import com.sharestory.sharestory_backend.service.AuctionOrderService;
import com.sharestory.sharestory_backend.service.DeliveryTrackingService;
import com.sharestory.sharestory_backend.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders/auction")
@RequiredArgsConstructor
public class AuctionOrderController {

    private final AuctionOrderService auctionOrderService;
    private final AuctionDeliveryTrackingService auctionDeliveryTrackingService;
    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final DeliveryTrackingService deliveryTrackingService;

    /** ✅ 배송정보 등록 (구매자) */
    @PutMapping("/{auctionId}/delivery")
    public ResponseEntity<String> registerDeliveryInfo(
            @PathVariable Long auctionId,
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody DeliveryInfoRequest req
    ) {
        auctionOrderService.saveDeliveryInfoAndPay(auctionId, user.getId(), req);
        return ResponseEntity.ok("배송정보 및 결제가 완료되었습니다.");
    }

    /** ✅ 배송정보 조회 (판매자용) */
    @GetMapping("/{auctionId}/delivery")
    public ResponseEntity<DeliveryInfo> getDeliveryInfo(
            @PathVariable Long auctionId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(auctionOrderService.getDeliveryInfo(auctionId, user.getId()));
    }

    /** ✅ 송장 등록 (판매자) */
    @PostMapping("/{auctionId}/delivery/invoice")
    public ResponseEntity<String> registerInvoice(
            @PathVariable Long auctionId,
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody DeliveryInvoiceRequest req
    ) {
        auctionOrderService.registerInvoice(auctionId, user.getId(), req);
        return ResponseEntity.ok("송장이 등록되었습니다.");
    }

    /** 📦 경매 물품 수령 확인 (구매자) */
    @PatchMapping("/{auctionId}/confirm-receipt")
    public ResponseEntity<String> confirmAuctionReceipt(
            @PathVariable Long auctionId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        auctionOrderService.confirmReceipt(auctionId, user.getId());
        return ResponseEntity.ok("구매자가 물품 수령을 확인했습니다.");
    }

    @PatchMapping("/{auctionId}/payout")
    public ResponseEntity<String> payoutToSeller(
            @PathVariable Long auctionId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        auctionOrderService.payoutToSeller(auctionId, user.getId());
        return ResponseEntity.ok("판매자 포인트가 지급되었습니다.");
    }

    // 🚛 경매 배송 추적 조회 (auctionId 기반)
    @GetMapping("/{auctionId}/delivery/tracking")
    public ResponseEntity<DeliveryTrackingResponse> trackAuctionDelivery(
            @PathVariable Long auctionId
    ) {
        DeliveryTrackingResponse tracking = auctionDeliveryTrackingService.getAuctionTracking(auctionId);
        return ResponseEntity.ok(tracking);
    }

}


