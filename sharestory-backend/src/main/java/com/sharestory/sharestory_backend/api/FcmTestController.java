package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.service.FcmService;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/fcm")
public class FcmTestController {

    private final FcmService fcmService;

    @PostMapping("/test")
    public ResponseEntity<String> sendTest(@AuthenticationPrincipal CustomUserDetails user) {
        if (user == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        // ✅ 테스트 메시지 전송
        fcmService.sendToUser(
                user.getId(),
                "🔥 FCM 테스트 알림",
                "이 알림이 보이면 ShareStory FCM이 완벽히 작동 중입니다!",
                "/"
        );

        return ResponseEntity.ok("테스트 알림 발송 요청 완료");
    }
}
