package com.sharestory.sharestory_backend.fcm;

import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.repo.UserRepository;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FCMController {

    private final FCMUtil fcmUtil;
    private final FcmTokenRepository fcmTokenRepository;
    private final UserRepository userRepository;

    @PostMapping("/fcm/save-token")
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
        Optional<User> userOptional = userRepository.findById(userId);

        if (userOptional.isPresent()) {
            User user = userOptional.get();

            // 이미 해당 토큰이 DB에 있는지 확인
            Optional<FcmToken> existingToken = fcmTokenRepository.findByToken(token);
            if (existingToken.isPresent()) {
                // 토큰이 이미 있으면 아무것도 하지 않음 (또는 업데이트 로직 추가 가능)
                return ResponseEntity.ok(existingToken);
            } else {
                // 기존 토큰이 없으면 새로 저장
                FcmToken fcmToken = new FcmToken();
                fcmToken.setToken(token);
                fcmToken.setUser(user);
                fcmTokenRepository.save(fcmToken);
            }

            return ResponseEntity.ok("FCM Token이 저장/업데이트되었습니다.");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("사용자를 찾을 수 없습니다.");
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