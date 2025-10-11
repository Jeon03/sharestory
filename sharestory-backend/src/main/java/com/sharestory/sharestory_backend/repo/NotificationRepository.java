package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // 특정 사용자의 모든 알림을 최신순으로 조회
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);
    // 특정 사용자의 읽지 않은 알림 개수 조회
    long countByRecipientIdAndIsReadFalse(Long recipientId);
}