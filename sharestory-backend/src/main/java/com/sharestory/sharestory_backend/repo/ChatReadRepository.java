package com.sharestory.sharestory_backend.repo;


import com.sharestory.sharestory_backend.domain.ChatMessage;
import com.sharestory.sharestory_backend.domain.ChatRead;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;


public interface ChatReadRepository extends JpaRepository<ChatRead, Long> {


    // 특정 유저의 전체 안읽은 메시지 수
    @Query("SELECT COUNT(cr) FROM ChatRead cr WHERE cr.userId = :userId AND cr.read = false")
    int countUnreadByUser(@Param("userId") Long userId);
    List<ChatRead> findByMessage_Room_IdAndUserIdAndReadFalse(Long roomId, Long userId);
    // 특정 방의 안읽은 메시지를 모두 읽음 처리
    @Modifying
    @Query("UPDATE ChatRead cr " +
            "SET cr.read = true, cr.readAt = CURRENT_TIMESTAMP " +
            "WHERE cr.message.room.id = :roomId " +
            "AND cr.userId = :userId " +
            "AND cr.read = false")
    int markAllAsRead(@Param("roomId") Long roomId, @Param("userId") Long userId);

    // 특정 방에서 특정 유저의 안읽은 메시지 수
    @Query("SELECT COUNT(r) FROM ChatRead r " +
            "WHERE r.userId = :userId AND r.message.room.id = :roomId AND r.read = false")
    int countUnreadByRoomAndUser(@Param("roomId") Long roomId, @Param("userId") Long userId);

    // 특정 메시지를 특정 유저가 읽었는지 여부 확인
    boolean existsByMessage_IdAndUserIdAndReadTrue(Long messageId, Long userId);

    // 특정 메시지를 특정 유저가 읽음 처리한 기록 가져오기
    Optional<ChatRead> findByMessage_IdAndUserId(Long messageId, Long userId);

    // 특정 방에서 특정 유저가 읽은 메시지 ID 목록
    @Query("SELECT r.message.id FROM ChatRead r " +
            "WHERE r.message.room.id = :roomId " +
            "AND r.userId = :userId " +
            "AND r.read = true")
    List<Long> findReadMessageIds(@Param("roomId") Long roomId, @Param("userId") Long userId);

    @Modifying
    @Query("delete from ChatRead cr where cr.message.room.id = :roomId")
    void deleteAllByRoomId(@Param("roomId") Long roomId);
}