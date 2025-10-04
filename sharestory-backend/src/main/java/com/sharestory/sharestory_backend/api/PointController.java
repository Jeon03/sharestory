// PointController.java
package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.dto.PointChargeRequest;
import com.sharestory.sharestory_backend.service.PointService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/points")
@RequiredArgsConstructor
public class PointController {

    private final PointService pointService;

    // 포인트 충전 (결제 검증 포함)
    @PostMapping("/charge")
    public ResponseEntity<?> chargePoints(
            @RequestBody PointChargeRequest request,
            @AuthenticationPrincipal(expression = "id") Long userId
    ) {
        int newBalance = pointService.verifyAndCharge(userId, request);
        return ResponseEntity.ok(Map.of(
                "message", "포인트 충전 성공",
                "balance", newBalance
        ));
    }

    @GetMapping
    public ResponseEntity<?> getPoints(@AuthenticationPrincipal(expression = "id") Long userId) {
        int points = pointService.getUserPoints(userId);
        return ResponseEntity.ok(Map.of("points", points));
    }

    // 포인트 내역 조회
    @GetMapping("/points/history")
    public ResponseEntity<?> getHistory(@AuthenticationPrincipal(expression = "id") Long userId) {
        return ResponseEntity.ok(pointService.getHistory(userId));
    }
}
