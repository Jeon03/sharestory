package com.sharestory.sharestory_backend.fcm;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Firebase Cloud Messaging (FCM) 메시지 전송을 처리하는 유틸리티 클래스입니다.
 */
@Slf4j
@Component
public class FCMUtil {

    /**
     * 지정된 디바이스 토큰으로 푸시 알림을 전송합니다.
     *
     * @param token 수신자의 FCM 디바이스 토큰
     * @param title 알림의 제목
     * @param body  알림의 본문 내용
     */
    public void send(String token, String title, String body) {
        // 로그: 어떤 내용으로 FCM 전송을 시도하는지 기록
        log.info("FCM 전송 시도: token={}, title={}, body={}", token, title, body);

        if (token == null || token.isBlank()) {
            // 로그: 토큰이 없어 전송이 불가능한 경우
            log.warn("FCM 토큰이 비어있어 메시지 전송을 건너뜁니다.");
            return;
        }

        // FCM Notification 객체 생성
        Notification notification = Notification.builder()
                .setTitle(title)
                .setBody(body)
                .build();

        // FCM Message 객체 생성
        Message message = Message.builder()
                .setToken(token)
                .setNotification(notification)
                .build();

        try {
            // FirebaseMessaging 인스턴스를 통해 메시지 동기적으로 전송
            String response = FirebaseMessaging.getInstance().send(message);
            // 로그: FCM 전송 성공 시 Firebase로부터 받은 메시지 ID 기록
            log.info("FCM 전송 성공: Message ID={}", response);
        } catch (Exception e) {
            // 로그: FCM 전송 실패 시 에러 메시지 상세 기록
            log.error("FCM 전송 실패: token={}", token, e);
        }
    }
}