package com.sharestory.sharestory_backend.repo;


import com.sharestory.sharestory_backend.domain.ChatRead;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;



public interface ChatReadRepository extends JpaRepository<ChatRead, Long> {

    // ✅ 특정 유저의 안읽음 메시지 개수
    @Query("SELECT COUNT(cr) FROM ChatRead cr WHERE cr.userId = :userId AND cr.read = false")
    Long countUnreadByUserId(@Param("userId") Long userId);




    // 특정 방의 안읽은 메시지를 모두 읽음 처리
    @Modifying
    @Query("UPDATE ChatRead cr " +
            "SET cr.read = true, cr.readAt = CURRENT_TIMESTAMP " +
            "WHERE cr.message.room.id = :roomId " +
            "AND cr.userId = :userId " +
            "AND cr.read = false")
    int markAllAsRead(@Param("roomId") Long roomId, @Param("userId") Long userId);

    // 특정 유저의 전체 안읽은 메시지 수
    @Query("SELECT COUNT(cr) " +
            "FROM ChatRead cr " +
            "WHERE cr.userId = :userId " +
            "AND cr.read = false")
    int countUnreadByUser(@Param("userId") Long userId);

    @Query("SELECT COUNT(r) FROM ChatRead r " +
            "WHERE r.userId = :userId AND r.message.room.id = :roomId AND r.read = false")
    int countUnreadByRoomAndUser(@Param("roomId") Long roomId, @Param("userId") Long userId);
}