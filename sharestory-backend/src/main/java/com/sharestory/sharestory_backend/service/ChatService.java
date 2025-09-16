package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.ChatMessage;
import com.sharestory.sharestory_backend.domain.ChatRoom;
import com.sharestory.sharestory_backend.domain.Item;
import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.dto.ChatMessageDto;
import com.sharestory.sharestory_backend.dto.ChatRoomDto;
import com.sharestory.sharestory_backend.repo.ChatMessageRepository;
import com.sharestory.sharestory_backend.repo.ChatRoomRepository;
import com.sharestory.sharestory_backend.repo.ItemRepository;
import com.sharestory.sharestory_backend.repo.UserRepository;
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
                    return ChatRoomDto.from(room, partnerName, lastMsg);
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
                .type(dto.getType())              // ✅ 메시지 타입 저장
                .createdAt(LocalDateTime.now())
                .build();

        return chatMessageRepository.save(msg);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getMessages(Long roomId) {
        return chatMessageRepository.findByRoom_IdOrderByCreatedAtAsc(roomId)
                .stream()
                .map(ChatMessageDto::from)
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

}
