package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByRoom_IdOrderByCreatedAtAsc(Long roomId);
}