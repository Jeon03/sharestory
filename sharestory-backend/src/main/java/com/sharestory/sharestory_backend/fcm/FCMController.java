package com.sharestory.sharestory_backend.fcm;

import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.repo.BidDepositRepository;
import com.sharestory.sharestory_backend.repo.UserRepository;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.Optional;
@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FCMController {

    private final FCMUtil fcmUtil;
    private final FcmTokenRepository fcmTokenRepository;
    private final UserRepository userRepository;
    private final BidDepositRepository bidDepositRepository;
    @PostMapping("/fcm/save-token")
    @Transactional // 👈 여러 테이블을 수정하므로 트랜잭션 처리
    public ResponseEntity<?> saveFcmToken(@RequestBody Map<String, String> payload,
                                          @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        String token = payload.get("token");
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("FCM 토큰이 없습니다.");
        }

        Long userId = userDetails.getId();
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 1. FCM 토큰 저장 로직 (기존과 동일)
        Optional<FcmToken> existingToken = fcmTokenRepository.findByToken(token);
        if (existingToken.isEmpty()) {
            FcmToken fcmToken = FcmToken.builder().token(token).user(currentUser).build();
            fcmTokenRepository.save(fcmToken);
        }

        // 2. [핵심] 로그인 시 currentTotalPrice 전체 재계산
        int totalBidAmount = bidDepositRepository.sumAmountByUser(currentUser);
        currentUser.setCurrentTotalBidPrice(totalBidAmount);
        userRepository.save(currentUser);
        log.info("User ID: [{}]의 currentTotalPrice를 [{}]로 동기화했습니다.", userId, totalBidAmount);

        return ResponseEntity.ok("FCM Token 저장 및 입찰 총액 동기화 완료.");
    }

    @PostMapping("/send-push-notification")
    public ResponseEntity<?> sendPushNotification(@RequestBody PushNotificationRequest request) {
        try {
            fcmUtil.send(request.getToken(), request.getTitle(), request.getBody());
            return ResponseEntity.ok(Map.of("success", true, "message", "푸시 알림 전송 성공"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/fcm/my-tokens")
    public ResponseEntity<?> getMyTokens(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        List<FcmToken> tokens = fcmTokenRepository.findByUserId(userDetails.getId());
        List<String> tokenValues = tokens.stream().map(FcmToken::getToken).toList();
        return ResponseEntity.ok(tokenValues);
    }
}