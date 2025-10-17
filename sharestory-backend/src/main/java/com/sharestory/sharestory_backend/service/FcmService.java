package com.sharestory.sharestory_backend.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
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
        if (firebaseMessaging == null) {
            log.warn("⚠️ FirebaseMessaging 비활성화 상태 → FCM 전송 스킵 (userId={})", userId);
            return;
        }

        String redisKey = "fcm:chat:lastSent:" + userId;

        try {
            if (redisTemplate.hasKey(redisKey)) {
                log.info("⏳ FCM 쿨다운 중 → userId={} 생략", userId);
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

                    // ✅ 쿨다운 적용 (3초)
                    redisTemplate.opsForValue().set(redisKey, "sent", Duration.ofSeconds(NOTIFY_COOLDOWN_SECONDS));

                } catch (FirebaseMessagingException e) {
                    String errMsg = e.getMessage();
                    log.error("❌ FCM 전송 실패 → userId={}, 이유={}", userId, errMsg);

                    // ✅ 만료된 토큰 자동 삭제 처리
                    if (errMsg != null && (
                            errMsg.contains("Requested entity was not found") ||
                                    errMsg.contains("NotRegistered") ||
                                    errMsg.contains("InvalidRegistration")
                    )) {
                        log.warn("🗑️ 무효 FCM 토큰 감지 → DB에서 삭제: {}", token.getToken());
                        tokenRepo.delete(token);
                    }
                }
            }, () -> log.warn("⚠️ userId={} FCM 토큰이 없습니다.", userId));

        } catch (Exception e) {
            log.error("❌ sendToUser() 처리 중 오류 → {}", e.getMessage(), e);
        }
    }

    public void sendNotification(String token, String title, String body) {
        if (firebaseMessaging == null) {
            log.warn("⚠️ FirebaseMessaging 비활성화 상태 → 알림 스킵 (token={})", token);
            return;
        }

        try {
            Message message = Message.builder()
                    .setToken(token)
                    .setNotification(
                            Notification.builder()
                                    .setTitle(title)
                                    .setBody(body)
                                    .build()
                    )
                    .build();

            firebaseMessaging.send(message);
            log.info("✅ [FCM] 푸시 전송 성공 → token={}", token);

        } catch (FirebaseMessagingException e) {
            String errMsg = e.getMessage();
            log.error("❌ [FCM] 푸시 전송 실패 → token={}, 이유={}", token, errMsg);

            // ✅ 무효 토큰 즉시 삭제
            if (errMsg != null && (
                    errMsg.contains("Requested entity was not found") ||
                            errMsg.contains("NotRegistered") ||
                            errMsg.contains("InvalidRegistration")
            )) {
                log.warn("🗑️ 무효 FCM 토큰 감지 → DB에서 삭제: {}", token);
                tokenRepo.deleteByToken(token);
            }
        } catch (Exception e) {
            log.error("❌ [FCM] 알림 전송 중 예외 발생 → {}", e.getMessage(), e);
        }
    }
}
