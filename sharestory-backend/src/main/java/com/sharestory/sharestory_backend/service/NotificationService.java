package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.Notification;
import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.repo.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendNotification(User user, String type, String message, Long referenceId) {
        try {
            log.info("🔔 [NotificationService] 알림 생성 시작 → user={}, type={}, refId={}",
                    user.getNickname(), type, referenceId);

            // 1️⃣ DB 저장
            Notification noti = Notification.builder()
                    .user(user)
                    .type(type)
                    .message(message)
                    .referenceId(referenceId)
                    .build();

            Notification saved = notificationRepository.save(noti);
            log.info("✅ [NotificationService] 알림 DB 저장 완료 → id={}, userId={}, message={}",
                    saved.getId(), user.getId(), saved.getMessage());

            // 2️⃣ 실시간 STOMP 전송
            messagingTemplate.convertAndSendToUser(
                    user.getId().toString(),
                    "/queue/notifications",
                    Map.of(
                            "id", saved.getId(),
                            "type", saved.getType(),
                            "message", saved.getMessage(),
                            "referenceId", saved.getReferenceId(),
                            "createdAt", saved.getCreatedAt().toString()
                    )
            );
            log.info("📡 [NotificationService] STOMP 전송 완료 → 대상 사용자 ID={}, 목적지=/user/{}/queue/notifications",
                    user.getId(), user.getId());

        } catch (Exception e) {
            log.error("❌ [NotificationService] 알림 처리 실패: {}", e.getMessage(), e);
        }
    }

    @Transactional
    public void markAsRead(Long id) {
        Notification noti = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 알림이 존재하지 않습니다."));
        if (!noti.isRead()) {
            noti.setRead(true);
            notificationRepository.save(noti);
            log.info("✅ [NotificationService] DB 읽음 상태 업데이트 완료 → id={}", id);
        }
    }
}
