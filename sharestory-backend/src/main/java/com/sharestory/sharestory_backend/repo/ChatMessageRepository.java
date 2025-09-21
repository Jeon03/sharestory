package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.ChatMessage;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByRoom_IdOrderByCreatedAtAsc(Long roomId);

    // 전체 합계 (모든 방의 안읽은 메시지 개수)
    @Query("SELECT COUNT(m) FROM ChatMessage m " +
            "WHERE m.senderId <> :userId " +
            "AND NOT EXISTS (" +
            "   SELECT 1 FROM ChatRead r " +
            "   WHERE r.message = m AND r.userId = :userId AND r.read = true" +
            ")")
    int countUnreadMessages(@Param("userId") Long userId);

    // 특정 방의 안읽은 메시지 개수
    @Query("SELECT COUNT(m) FROM ChatMessage m " +
            "WHERE m.room.id = :roomId " +
            "AND m.senderId <> :userId " +
            "AND NOT EXISTS (" +
            "   SELECT 1 FROM ChatRead r " +
            "   WHERE r.message = m AND r.userId = :userId AND r.read = true" +
            ")")
    int countUnreadMessagesByRoom(@Param("roomId") Long roomId, @Param("userId") Long userId);

    void deleteAllByRoomId(Long roomId);

}