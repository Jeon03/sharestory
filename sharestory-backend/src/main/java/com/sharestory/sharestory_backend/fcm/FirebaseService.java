package com.sharestory.sharestory_backend.fcm; // ✅ 패키지 경로만 프로젝트에 맞게 확인하세요.

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j // ✅ Log 사용을 위해 추가
@Service
@RequiredArgsConstructor
public class FirebaseService {

    private final FcmTokenRepository fcmTokenRepository;
    private final FCMUtil fcmUtil;

    /**
     * 특정 사용자에게 푸시 알림을 전송하는 핵심 메소드
     * @param receiverId    알림을 받을 사용자의 ID
     * @param messageTitle  알림 제목
     * @param messageBody   알림 내용
     */
    @Transactional
    public void sendPushNotificationToUser(Long receiverId, String messageTitle, String messageBody) {
        // ✅ Repository 메소드 이름을 findByMember_Id -> findByUserId 로 변경
        List<FcmToken> receiverTokens = fcmTokenRepository.findByUserId(receiverId);

        if (!receiverTokens.isEmpty()) {
            log.info("📢 사용자 ID {} 에게 푸시 알림 전송을 시도합니다. 총 {}개의 토큰.", receiverId, receiverTokens.size());
            for (FcmToken tokenEntity : receiverTokens) {
                String token = tokenEntity.getToken();
                try {
                    fcmUtil.send(token, messageTitle, messageBody);
                    log.info("✅ 토큰 {} 으로 푸시 알림 전송 성공", token);
                } catch (Exception e) {
                    log.warn("❌ 토큰 {} 으로 푸시 알림 전송 실패: {}", token, e.getMessage());
                    // ✅ 무효한 토큰을 데이터베이스에서 삭제하는 로직
                    if (e.getMessage() != null && e.getMessage().contains("해당 토큰은 더 이상 유효하지 않습니다.")) {
                        log.info("🗑️ 무효한 토큰을 삭제합니다: {}", token);
                        fcmTokenRepository.delete(tokenEntity);
                    }
                }
            }
        } else {
            log.warn("🤷‍♂️ 사용자 ID {} 의 FCM 토큰이 존재하지 않아 푸시 알림을 보낼 수 없습니다.", receiverId);
        }
    }
}