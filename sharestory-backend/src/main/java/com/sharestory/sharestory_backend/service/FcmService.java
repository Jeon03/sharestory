package com.sharestory.sharestory_backend.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.sharestory.sharestory_backend.repo.FcmTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class FcmService {

    private final FcmTokenRepository tokenRepo;
    private final FirebaseMessaging firebaseMessaging;

    public void sendToUser(Long userId, String title, String body, String clickAction) {
        tokenRepo.findByUserId(userId).ifPresentOrElse(token -> {
            Message message = Message.builder()
                    .setToken(token.getToken())
                    .putData("title", title)
                    .putData("body", body)
                    .putData("click_action", clickAction)
                    .build();

            try {
                String response = firebaseMessaging.send(message);
                log.info("✅ FCM 메시지 전송 성공: {}", response);
            } catch (FirebaseMessagingException e) {
                log.error("❌ FCM 전송 실패: {}", e.getMessage());
            }
        }, () -> log.warn("⚠️ userId={} FCM 토큰이 없습니다.", userId));
    }
}
