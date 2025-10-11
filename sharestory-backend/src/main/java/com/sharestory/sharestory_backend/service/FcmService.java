package com.sharestory.sharestory_backend.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.sharestory.sharestory_backend.repo.FcmTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class FcmService {

    private final FcmTokenRepository tokenRepo;
    private final FirebaseMessaging firebaseMessaging;
    private final StringRedisTemplate redisTemplate;

    private static final long NOTIFY_COOLDOWN_SECONDS = 3;

    @Async
    public void sendToUser(Long userId, String title, String body, String clickAction, Long roomId) {
        String redisKey = "fcm:chat:lastSent:" + userId;

        try {

            if (redisTemplate.hasKey(redisKey)) {
                log.info("⏳ userId={} 생략", userId);
                return;
            }

            tokenRepo.findByUserId(userId).ifPresentOrElse(token -> {
                Message message = Message.builder()
                        .setToken(token.getToken())
                        .putData("title", title)
                        .putData("body", body)
                        .putData("click_action", clickAction)
                        .putData("roomId", String.valueOf(roomId))
                        .putData("type", "CHAT")
                        .build();

                try {
                    String response = firebaseMessaging.send(message);
                    log.info("✅ FCM 전송 성공 → userId={}, roomId={}, response={}", userId, roomId, response);

                    redisTemplate.opsForValue().set(redisKey, "sent", Duration.ofSeconds(NOTIFY_COOLDOWN_SECONDS));
                } catch (FirebaseMessagingException e) {
                    log.error("❌ FCM 전송 실패: {}", e.getMessage());
                }
            }, () -> log.warn("⚠️ userId={} FCM 토큰이 없습니다.", userId));

        } catch (Exception e) {
            log.error("❌ sendToUser() 처리 중 오류 → {}", e.getMessage(), e);
        }
    }
}
