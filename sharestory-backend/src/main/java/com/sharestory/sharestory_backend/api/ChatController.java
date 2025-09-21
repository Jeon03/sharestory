package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.domain.ChatMessage;
import com.sharestory.sharestory_backend.domain.ChatRoom;
import com.sharestory.sharestory_backend.dto.ChatMessageDto;
import com.sharestory.sharestory_backend.dto.ChatReadDto;
import com.sharestory.sharestory_backend.dto.ChatRoomDto;
import com.sharestory.sharestory_backend.repo.ChatReadRepository;
import com.sharestory.sharestory_backend.repo.ChatRoomRepository;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import com.sharestory.sharestory_backend.service.ChatService;
import com.sharestory.sharestory_backend.service.S3Service;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatController {

    private final S3Service s3Service;
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatReadRepository chatReadRepository;

    @MessageMapping("/message")
    public void message(ChatMessageDto dto) {
        // 1) DB 저장
        ChatMessage saved = chatService.saveMessage(dto);

        // 2) 방 단위 publish (기존)
        messagingTemplate.convertAndSend(
                "/sub/chat/room/" + dto.getRoomId(),
                ChatMessageDto.from(saved)
        );

        // 3) 글로벌 publish (추가)
        ChatRoom room = chatService.findRoom(dto.getRoomId());
        Long sellerId = room.getSellerId();
        Long buyerId = room.getBuyerId();

        ChatMessageDto payload = ChatMessageDto.from(saved);

        // 판매자에게 발송 (단, 본인이 보낸 메시지는 제외)
        if (!dto.getSenderId().equals(sellerId)) {
            messagingTemplate.convertAndSend("/sub/chat/user/" + sellerId, payload);
        }

        // 구매자에게 발송 (단, 본인이 보낸 메시지는 제외)
        if (!dto.getSenderId().equals(buyerId)) {
            messagingTemplate.convertAndSend("/sub/chat/user/" + buyerId, payload);
        }
    }

    // 상품 상세에서 채팅방 생성 or 조회
    @PostMapping("/room")
    public ChatRoomDto createOrGetRoom(
            @RequestParam Long itemId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return chatService.createOrGetRoom(itemId, user.getId());
    }

    // 채팅방 목록 (내가 속한 모든 방)
    @GetMapping("/rooms")
    public List<ChatRoomDto> getMyRooms(@AuthenticationPrincipal CustomUserDetails user) {
        return chatService.getRooms(user.getId());
    }

    // 채팅방 메시지 조회
    @GetMapping("/room/{roomId}/messages")
    public List<ChatMessageDto> getMessages(
            @PathVariable Long roomId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return chatService.getMessages(roomId, user.getId());
    }

    /**
     * 채팅방 상품 정보 조회
     */
    @GetMapping("/room/{roomId}/item")
    public Map<String, Object> getItemByRoom(@PathVariable Long roomId) {
        return chatService.getItemByRoom(roomId);
    }
    /**
     * 채팅 이미지 업로드
     */
    @PostMapping("/upload")
    public Map<String, String> uploadImage(
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        // "chat" 폴더 밑에 저장
        String url = s3Service.uploadFile(file, "chat");

        Map<String, String> response = new HashMap<>();
        response.put("url", url);
        return response;
    }


    // 전체 안읽은 메시지 수
    @GetMapping("/unreadCounts")
    public ResponseEntity<Map<String, Object>> getUnreadCounts(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        Map<Long, Integer> unreadCounts = chatService.getUnreadCountPerRoom(user.getId());
        int totalUnread = unreadCounts.values().stream().mapToInt(Integer::intValue).sum();

        return ResponseEntity.ok(Map.of(
                "unreadCounts", unreadCounts,
                "totalUnread", totalUnread
        ));
    }

    // 방 입장 → 안읽은 메시지 모두 읽음 처리
    @PostMapping("/{roomId}/read")
    public ResponseEntity<Map<String, Object>> markRoomAsRead(
            @PathVariable Long roomId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        chatService.markMessagesAsRead(roomId, user.getId());
        int totalUnread = chatService.getTotalUnreadCount(user.getId());
        return ResponseEntity.ok(Map.of("unreadCount", totalUnread));
    }


    @MessageMapping("/read")
    public void read(ChatReadDto dto) {
        // DB 업데이트
        chatService.markMessagesAsRead(dto.getRoomId(), dto.getUserId());

        // ✅ 읽힌 메시지 ID들 가져오기
        List<Long> readIds = chatService.getReadMessageIds(dto.getRoomId(), dto.getUserId());

        // 상대방에게 브로드캐스트
        messagingTemplate.convertAndSend(
                "/sub/chat/room/" + dto.getRoomId() + "/read",
                Map.of(
                        "roomId", dto.getRoomId(),
                        "userId", dto.getUserId(),
                        "readIds", readIds
                )
        );

        System.out.println("📥 읽음 이벤트 도착: " + dto);
    }
}

