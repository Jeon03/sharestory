package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.domain.FcmToken;
import com.sharestory.sharestory_backend.repo.FcmTokenRepository;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/fcm")
public class FcmTokenController {

    private final FcmTokenRepository fcmTokenRepository;

    @PostMapping("/token")
    public ResponseEntity<String> saveToken(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody Map<String, String> body
    ) {
        String token = body.get("token");
        if (token == null || token.isEmpty()) {
            return ResponseEntity.badRequest().body("토큰이 비어있습니다.");
        }

        fcmTokenRepository.findByUserId(user.getId())
                .ifPresentOrElse(
                        existing -> existing.setToken(token),
                        () -> fcmTokenRepository.save(
                                FcmToken.builder().userId(user.getId()).token(token).build()
                        )
                );

        return ResponseEntity.ok("FCM 토큰 등록 완료");
    }
}