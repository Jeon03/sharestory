package com.sharestory.sharestory_backend.admin;

import com.sharestory.sharestory_backend.domain.Notification;
import com.sharestory.sharestory_backend.repo.NotificationRepository;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    /**
     * ✅ 로그인한 사용자의 전체 알림 조회 (최신순)
     */
    @GetMapping
    public ResponseEntity<List<Notification>> getUserNotifications(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return ResponseEntity.ok(list);
    }

    /**
     * ✅ 안 읽은 알림 개수 조회 (뱃지용)
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        long count = notificationRepository.countByUserIdAndIsReadFalse(user.getId());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    /**
     * ✅ 특정 알림 읽음 처리
     */
    @PostMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return notificationRepository.findByIdAndUserId(id, user.getId())
                .map(noti -> {
                    noti.setRead(true);
                    notificationRepository.save(noti);
                    return ResponseEntity.ok(Map.<String, Object>of(
                            "success", true,
                            "message", "알림이 읽음 처리되었습니다."
                    ));
                })
                .orElseGet(() -> ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "해당 알림을 찾을 수 없습니다."
                )));
    }

    @PostMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        List<Notification> notis = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        notis.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notis);
        return ResponseEntity.ok(Map.of("success", true, "message", "모든 알림을 읽음 처리했습니다."));
    }
}
