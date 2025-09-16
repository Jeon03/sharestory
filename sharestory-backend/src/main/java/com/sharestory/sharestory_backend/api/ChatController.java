package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.domain.ChatMessage;
import com.sharestory.sharestory_backend.dto.ChatMessageDto;
import com.sharestory.sharestory_backend.dto.ChatRoomDto;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import com.sharestory.sharestory_backend.service.ChatService;
import com.sharestory.sharestory_backend.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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

    // STOMP 메시지 전송
    @MessageMapping("/message")
    public void message(ChatMessageDto dto) {
        ChatMessage saved = chatService.saveMessage(dto);
        messagingTemplate.convertAndSend(
                "/sub/chat/room/" + dto.getRoomId(),
                ChatMessageDto.from(saved)
        );
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

    // ✅ 채팅방 메시지 조회
    @GetMapping("/room/{roomId}/messages")
    public List<ChatMessageDto> getMessages(@PathVariable Long roomId) {
        return chatService.getMessages(roomId); // 이미 DTO 반환
    }


    @GetMapping("/room/{roomId}/item")
    public Map<String, Object> getItemByRoom(@PathVariable Long roomId) {
        return chatService.getItemByRoom(roomId);
    }

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
}

