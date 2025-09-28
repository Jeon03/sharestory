package com.sharestory.sharestory_backend.api;


import com.sharestory.sharestory_backend.dto.SafeOrderRequest;
import com.sharestory.sharestory_backend.repo.OrderRepository;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import com.sharestory.sharestory_backend.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final OrderRepository orderRepository;

    @PostMapping("/safe")
    public ResponseEntity<?> createSafeOrder(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody SafeOrderRequest request
    ) {
        try {
            orderService.createSafeOrder(request.getItemId(), user.getId(), request.getDeliveryInfo());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "안전거래 주문이 생성되었습니다."
            ));
        } catch (IllegalStateException e) {
            // 포인트 부족, 상태 불가 등
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "결제 처리 중 오류: " + e.getMessage()
            ));
        }
    }

}