package com.sharestory.sharestory_backend.api;


import com.sharestory.sharestory_backend.domain.Notification;
import com.sharestory.sharestory_backend.dto.NotificationDto;
import com.sharestory.sharestory_backend.dto.NotificationResponseDto;
import com.sharestory.sharestory_backend.repo.NotificationRepository;
import com.sharestory.sharestory_backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    /**
     * 📬 특정 유저의 알림 목록 조회
     */
    @GetMapping("/{userId}")
    public ResponseEntity<List<NotificationResponseDto>> getNotifications(@PathVariable Long userId) {
        List<NotificationResponseDto> notifications = notificationRepository
                .findByUser_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponseDto::from)
                .toList();

        return ResponseEntity.ok(notifications);
    }

    /**
     * 👁️ 특정 알림 읽음 처리
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 🧹 모든 알림 읽음 처리 (선택사항)
     */
    @PatchMapping("/user/{userId}/read-all")
    public ResponseEntity<Void> markAllAsRead(@PathVariable Long userId) {
        List<Notification> notis = notificationRepository.findByUser_IdAndIsReadFalse(userId);
        notis.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notis);

        log.info("✅ [NotificationController] userId={} 모든 알림 읽음 처리 완료", userId);
        return ResponseEntity.ok().build();
    }

    /**
     * 🗑️ 알림 삭제 (선택사항)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        notificationRepository.deleteById(id);
        log.info("🗑️ [NotificationController] 알림 삭제 → id={}", id);
        return ResponseEntity.noContent().build();
    }
}
