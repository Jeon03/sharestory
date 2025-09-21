package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.*;
import com.sharestory.sharestory_backend.dto.ChatMessageDto;
import com.sharestory.sharestory_backend.dto.ChatRoomDto;
import com.sharestory.sharestory_backend.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final ChatReadRepository chatReadRepository;

    @Transactional
    public ChatRoomDto createOrGetRoom(Long itemId, Long buyerId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("상품 없음"));

        Long sellerId = item.getUserId();
        if (sellerId == null) {
            throw new RuntimeException("상품에 판매자 정보가 없습니다.");
        }

        return chatRoomRepository.findByItem_IdAndBuyerId(itemId, buyerId)
                .map(room -> {
                    String partnerName = userRepository.findById(sellerId)
                            .map(User::getNickname)
                            .orElse("알 수 없음");
                    String lastMsg = room.getMessages().isEmpty() ? "" :
                            room.getMessages().get(room.getMessages().size() - 1).getContent();
                    return ChatRoomDto.from(room, partnerName, lastMsg);
                })
                .orElseGet(() -> {
                    ChatRoom newRoom = ChatRoom.builder()
                            .item(item)
                            .buyerId(buyerId)
                            .sellerId(sellerId)
                            .updatedAt(LocalDateTime.now())
                            .build();
                    chatRoomRepository.save(newRoom);

                    String partnerName = userRepository.findById(sellerId)
                            .map(User::getNickname)
                            .orElse("알 수 없음");

                    return ChatRoomDto.from(newRoom, partnerName, "");
                });
    }


    @Transactional(readOnly = true)
    public List<ChatRoomDto> getRooms(Long userId) {
        return chatRoomRepository.findByBuyerIdOrSellerId(userId, userId)
                .stream()
                .map(room -> {
                    String partnerName =
                            room.getBuyerId().equals(userId)
                                    ? userRepository.findById(room.getSellerId()).get().getNickname()
                                    : userRepository.findById(room.getBuyerId()).get().getNickname();

                    String lastMsg = room.getMessages().isEmpty() ? "" :
                            room.getMessages().get(room.getMessages().size()-1).getContent();


                    int unreadCount = chatReadRepository.countUnreadByRoomAndUser(room.getId(), userId);
                    return ChatRoomDto.from(room, partnerName, lastMsg, unreadCount);
                })
                .toList();
    }

    @Transactional
    public ChatMessage saveMessage(ChatMessageDto dto) {
        ChatRoom room = chatRoomRepository.findById(dto.getRoomId())
                .orElseThrow(() -> new RuntimeException("채팅방 없음"));

        ChatMessage msg = ChatMessage.builder()
                .room(room)
                .senderId(dto.getSenderId())
                .content(dto.getContent())
                .type(dto.getType())
                .createdAt(LocalDateTime.now())
                .build();

        ChatMessage saved = chatMessageRepository.save(msg);

        // ✅ 상대방에게 안읽음(ChatRead) 기록 생성
        Long receiverId = room.getBuyerId().equals(dto.getSenderId())
                ? room.getSellerId()
                : room.getBuyerId();

        ChatRead chatRead = ChatRead.builder()
                .message(saved)
                .userId(receiverId)
                .read(false)
                .build();

        chatReadRepository.save(chatRead);

        // ✅ 마지막 메시지 시간 갱신
        room.setUpdatedAt(LocalDateTime.now());

        return saved;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getMessages(Long roomId, Long userId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("채팅방 없음"));

        Long buyerId = room.getBuyerId();
        Long sellerId = room.getSellerId();

        // 상대방 ID 계산 (내가 보낸 메시지 확인용)
        Long opponentId = buyerId.equals(userId) ? sellerId : buyerId;

        List<ChatMessage> messages = chatMessageRepository.findByRoom_IdOrderByCreatedAtAsc(roomId);

        return messages.stream()
                .map(msg -> {
                    boolean read;

                    if (msg.getSenderId().equals(userId)) {
                        // ✅ 내가 보낸 메시지 → 상대방이 읽었는지 확인
                        read = chatReadRepository.existsByMessage_IdAndUserIdAndReadTrue(msg.getId(), opponentId);
                    } else {
                        // ✅ 내가 받은 메시지 → 나는 이미 읽었음
                        read = true;
                    }

                    return ChatMessageDto.from(msg, read);
                })
                .toList();
    }


    @Transactional(readOnly = true)
    public Map<String, Object> getItemByRoom(Long roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("채팅방 없음"));
        Item item = room.getItem(); // 트랜잭션 안에서 Lazy 로딩

        Map<String, Object> result = new HashMap<>();
        result.put("id", item.getId());
        result.put("title", item.getTitle());
        result.put("price", item.getPrice());
        result.put("imageUrl", item.getImageUrl());
        result.put("description", item.getDescription());
        return result;
    }

    @Transactional
    public void markMessagesAsRead(Long roomId, Long userId) {
        chatReadRepository.markAllAsRead(roomId, userId);
    }


    /**
     * 유저의 전체 안읽은 메시지 합계
     */
    public int getTotalUnreadCount(Long userId) {
        return chatMessageRepository.countUnreadMessages(userId);
    }

    /**
     * 유저가 속한 방별 안읽은 메시지 수를 계산
     */
    public Map<Long, Integer> getUnreadCountPerRoom(Long userId) {
        Map<Long, Integer> result = new HashMap<>();

        // ✅ 유저가 속한 모든 채팅방 가져오기
        List<ChatRoom> rooms = chatRoomRepository.findByBuyerIdOrSellerId(userId, userId);

        for (ChatRoom room : rooms) {
            int count = chatMessageRepository.countUnreadMessagesByRoom(room.getId(), userId);
            result.put(room.getId(), count);
        }

        return result;
    }

    @Transactional(readOnly = true)
    public ChatRoom findRoom(Long roomId) {
        return chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("채팅방 없음"));
    }

    @Transactional(readOnly = true)
    public List<Long> getReadMessageIds(Long roomId, Long userId) {
        return chatReadRepository.findReadMessageIds(roomId, userId);
    }

}
