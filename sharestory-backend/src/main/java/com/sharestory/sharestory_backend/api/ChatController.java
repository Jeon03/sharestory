package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.domain.ChatMessage;
import com.sharestory.sharestory_backend.domain.ChatRoom;
import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.dto.ChatMessageDto;
import com.sharestory.sharestory_backend.dto.ChatReadDto;
import com.sharestory.sharestory_backend.dto.ChatRoomDto;
import com.sharestory.sharestory_backend.fcm.FirebaseService; // ✅ 수정: FirebaseService import
import com.sharestory.sharestory_backend.repo.ChatReadRepository;
import com.sharestory.sharestory_backend.repo.ChatRoomRepository;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import com.sharestory.sharestory_backend.service.ChatService;
import com.sharestory.sharestory_backend.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

// ✅ 수정: NotificationRequestDto import 추가
import com.sharestory.sharestory_backend.dto.NotificationRequestDto;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatController {

    private final S3Service s3Service;
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatReadRepository chatReadRepository;
    private final ChatRoomRepository chatRoomRepository; // ✅ 수정: ChatRoomRepository 주입

    // ✅ 수정: NotificationService -> FirebaseService 주입
    private final FirebaseService firebaseService;

    @MessageMapping("/message")
    public void message(ChatMessageDto dto) {
        // ... 기존 message 메소드 (변경 없음) ...
        ChatMessage saved = chatService.saveMessage(dto);
        messagingTemplate.convertAndSend("/sub/chat/room/" + dto.getRoomId(), ChatMessageDto.from(saved));
        ChatRoom room = chatService.findRoom(dto.getRoomId());
        Long sellerId = room.getSellerId();
        Long buyerId = room.getBuyerId();
        ChatMessageDto payload = ChatMessageDto.from(saved);
        if (!dto.getSenderId().equals(sellerId)) {
            messagingTemplate.convertAndSend("/sub/chat/user/" + sellerId, payload);
        }
        if (!dto.getSenderId().equals(buyerId)) {
            messagingTemplate.convertAndSend("/sub/chat/user/" + buyerId, payload);
        }
    }

    // ... createOrGetRoom, getMyRooms 등 다른 메소드들 (변경 없음) ...
    @PostMapping("/room")
    public ChatRoomDto createOrGetRoom(@RequestParam Long itemId, @AuthenticationPrincipal CustomUserDetails user) { return chatService.createOrGetRoom(itemId, user.getId()); }
    @GetMapping("/rooms")
    public List<ChatRoomDto> getMyRooms(@AuthenticationPrincipal CustomUserDetails user) { return chatService.getRooms(user.getId()); }
    @GetMapping("/room/{roomId}/messages")
    public List<ChatMessageDto> getMessages(@PathVariable Long roomId, @AuthenticationPrincipal CustomUserDetails user) { return chatService.getMessages(roomId, user.getId()); }
    @GetMapping("/room/{roomId}/item")
    public Map<String, Object> getItemByRoom(@PathVariable Long roomId) { return chatService.getItemByRoom(roomId); }
    @PostMapping("/upload")
    public Map<String, String> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        String url = s3Service.uploadFile(file, "chat");
        Map<String, String> response = new HashMap<>();
        response.put("url", url);
        return response;
    }

    // --- [추가/수정된 코드 블록] ---
    /**
     * 프론트엔드로부터 채팅 푸시 알림을 보내달라는 요청을 받습니다.
     */
    @PostMapping("/notify")
    public ResponseEntity<Void> sendChatNotification(
            @RequestBody NotificationRequestDto notificationRequest,
            @AuthenticationPrincipal CustomUserDetails sender // 요청 보낸 사람(발신자)
    ) {
        Long roomId = notificationRequest.getRoomId();
        String messageContent = notificationRequest.getMessage();
        Long senderId = sender.getId();

        // 1. 채팅방 정보로 상대방(수신자) ID 찾기
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));

        Long recipientId = Objects.equals(senderId, room.getBuyerId()) ? room.getSellerId() : room.getBuyerId();

        // 2. 발신자 닉네임과 메시지 내용으로 푸시 알림 전송
        firebaseService.sendPushNotificationToUser(
                recipientId,
                sender.getNickname(), // 알림 제목: 보낸 사람 닉네임
                messageContent      // 알림 내용: 메시지
        );

        return ResponseEntity.ok().build();
    }
    // --- [추가/수정된 코드 블록 끝] ---


    // ... getUnreadCounts, markRoomAsRead, read 메소드들 (변경 없음) ...
    @GetMapping("/unreadCounts")
    public ResponseEntity<Map<String, Object>> getUnreadCounts(@AuthenticationPrincipal CustomUserDetails user) {
        Map<Long, Integer> unreadCounts = chatService.getUnreadCountPerRoom(user.getId());
        int totalUnread = unreadCounts.values().stream().mapToInt(Integer::intValue).sum();
        return ResponseEntity.ok(Map.of("unreadCounts", unreadCounts, "totalUnread", totalUnread));
    }
    @PostMapping("/{roomId}/read")
    public ResponseEntity<Map<String, Object>> markRoomAsRead(@PathVariable Long roomId, @AuthenticationPrincipal CustomUserDetails user) {
        chatService.markMessagesAsRead(roomId, user.getId());
        int totalUnread = chatService.getTotalUnreadCount(user.getId());
        return ResponseEntity.ok(Map.of("unreadCount", totalUnread));
    }
    @MessageMapping("/read")
    public void read(ChatReadDto dto) {
        chatService.markMessagesAsRead(dto.getRoomId(), dto.getUserId());
        List<Long> readIds = chatService.getReadMessageIds(dto.getRoomId(), dto.getUserId());
        messagingTemplate.convertAndSend("/sub/chat/room/" + dto.getRoomId() + "/read", Map.of("roomId", dto.getRoomId(), "userId", dto.getUserId(), "readIds", readIds));
        System.out.println("📥 읽음 이벤트 도착: " + dto);
    }
}