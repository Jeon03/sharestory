package com.sharestory.sharestory_backend.fcm;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service // ✅ 이 어노테이션으로 Spring Bean이 되어 'autowire' 오류를 해결합니다.
public class SseService {

    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter connect(Long userId) {
        SseEmitter emitter = new SseEmitter(10 * 60 * 1000L);
        emitters.put(userId, emitter);
        log.info("새로운 SSE emitter 연결: userId={}", userId);

        emitter.onCompletion(() -> {
            emitters.remove(userId);
            log.info("SSE emitter 연결 종료: userId={}", userId);
        });
        emitter.onTimeout(() -> {
            emitters.remove(userId);
            log.info("SSE emitter 타임아웃: userId={}", userId);
        });
        emitter.onError(e -> {
            emitters.remove(userId);
            log.error("SSE emitter 에러: userId={}", userId, e);
        });

        try {
            emitter.send(SseEmitter.event().name("connect").data("SSE 연결 성공!"));
        } catch (IOException e) {
            log.error("SSE 연결 성공 메시지 전송 실패: userId={}", userId, e);
        }

        return emitter;
    }

    // ✅ BidService에서 호출하는 'sendNotification' 메서드입니다.
    public void sendNotification(Long userId, String eventName, Object data) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
                log.info("SSE 알림 전송 성공: userId={}, eventName={}", userId, eventName);
            } catch (IOException e) {
                emitters.remove(userId);
                log.error("SSE 알림 전송 실패: userId={}", userId, e);
            }
        } else {
            log.warn("SSE 알림 전송 대상 없음: userId={}", userId);
        }
    }
}