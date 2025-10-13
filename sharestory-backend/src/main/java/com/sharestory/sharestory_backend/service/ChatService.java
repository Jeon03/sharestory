package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.*;
import com.sharestory.sharestory_backend.dto.ChatMessageDto;
import com.sharestory.sharestory_backend.dto.ChatRoomDto;
import com.sharestory.sharestory_backend.repo.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final ChatReadRepository chatReadRepository;
    private final FcmService fcmService;
    private final SimpMessagingTemplate simpMessagingTemplate;
    private final AuctionItemRepository auctionItemRepository;

    @Transactional
    public ChatRoomDto createOrGetRoom(Long itemId, Long buyerId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("상품 없음"));

        Long sellerId = item.getUserId();
        if (sellerId == null) throw new RuntimeException("상품에 판매자 정보가 없습니다.");

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
                    String partnerName = room.getBuyerId().equals(userId)
                            ? userRepository.findById(room.getSellerId()).get().getNickname()
                            : userRepository.findById(room.getBuyerId()).get().getNickname();

                    String lastMsg = room.getMessages().isEmpty() ? "" :
                            room.getMessages().get(room.getMessages().size() - 1).getContent();

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
                .notified(false)
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

        // ✅ FCM 알림 전송 (상대방에게만)
        try {
            // 보낸 사람 닉네임 조회
            String senderName = userRepository.findById(dto.getSenderId())
                    .map(User::getNickname)
                    .orElse("알 수 없는 사용자");

            // 클릭 시 이동할 URL (예: 채팅 페이지)
            String clickAction = "/";

            // 메시지 내용이 너무 길면 일부만 잘라서 표시
            String bodyPreview = dto.getContent().length() > 40
                    ? dto.getContent().substring(0, 40) + "..."
                    : dto.getContent();

            fcmService.sendToUser(
                    receiverId,
                    senderName + "님의 새 메시지",
                    bodyPreview,
                    clickAction,
                    room.getId()
            );

            // notified 플래그 갱신 (보냈다고 표시)
            saved.setNotified(true);

        } catch (Exception e) {
            log.error("❌ FCM 전송 실패 (userId={}): {}", receiverId, e.getMessage());
        }

        return saved;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getMessages(Long roomId, Long userId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("채팅방 없음"));

        Long buyerId = room.getBuyerId();
        Long sellerId = room.getSellerId();
        Long opponentId = buyerId.equals(userId) ? sellerId : buyerId;

        List<ChatMessage> messages = chatMessageRepository.findByRoom_IdOrderByCreatedAtAsc(roomId);

        return messages.stream()
                .map(msg -> {
                    boolean read;
                    if (msg.getSenderId().equals(userId)) {
                        read = chatReadRepository.existsByMessage_IdAndUserIdAndReadTrue(msg.getId(), opponentId);
                    } else {
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

        Map<String, Object> result = new HashMap<>();

        // ✅ 일반 상품 거래방
        if (room.getItem() != null) {
            Item item = room.getItem();
            result.put("type", "ITEM");
            result.put("id", item.getId());
            result.put("title", item.getTitle());
            result.put("price", item.getPrice());
            result.put("imageUrl", item.getImageUrl());
            result.put("description", item.getDescription());
            return result;
        }

        // ✅ 경매 상품 거래방
        if (room.getAuctionItem() != null) {
            AuctionItem auction = room.getAuctionItem();
            result.put("type", "AUCTION");
            result.put("id", auction.getId());
            result.put("title", auction.getTitle());
            result.put("startPrice", auction.getStartPrice());
            result.put("currentPrice", auction.getCurrentPrice());
            result.put("immediatePrice", auction.getImmediatePrice());
            result.put("imageUrl", auction.getMainImageUrl());
            result.put("description", auction.getDescription());
            result.put("status", auction.getStatus().name());
            return result;
        }

        throw new RuntimeException("상품 정보가 없는 채팅방입니다.");
    }

    @Transactional
    public void markMessagesAsRead(Long roomId, Long userId) {
        chatReadRepository.markAllAsRead(roomId, userId);
    }

    public int getTotalUnreadCount(Long userId) {
        return chatMessageRepository.countUnreadMessages(userId);
    }

    public Map<Long, Integer> getUnreadCountPerRoom(Long userId) {
        Map<Long, Integer> result = new HashMap<>();
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

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendSystemMessage(Long itemId, String content) {
        List<ChatRoom> rooms = chatRoomRepository.findByItem_Id(itemId);
        // 채팅방이 없으면 자동 생성
        if (rooms.isEmpty()) {
            Item item = itemRepository.findById(itemId)
                    .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다."));
            Long sellerId = item.getUserId();
            Long buyerId = item.getBuyerId(); // 안전거래 결제 시 buyerId가 존재

            if (buyerId == null) {
                log.warn("⚠️ 시스템 메시지를 보낼 수 없습니다 (buyerId 없음, itemId={})", itemId);
                return;
            }

            ChatRoom newRoom = ChatRoom.builder()
                    .item(item)
                    .buyerId(buyerId)
                    .sellerId(sellerId)
                    .updatedAt(LocalDateTime.now())
                    .build();

            chatRoomRepository.save(newRoom);
            rooms = List.of(newRoom);
            log.info("✅ 채팅방 자동 생성 → roomId={}, itemId={}", newRoom.getId(), itemId);
        }

        for (ChatRoom room : rooms) {
            ChatMessage systemMsg = ChatMessage.builder()
                    .room(room)
                    .senderId(0L) // 시스템 발신자
                    .content(content)
                    .type(ChatMessage.MessageType.SYSTEM)
                    .createdAt(LocalDateTime.now())
                    .build();

            ChatMessage saved = chatMessageRepository.save(systemMsg);

            // ✅ 구매자/판매자 각각 읽음 테이블에 추가
            Long buyerId = room.getBuyerId();
            Long sellerId = room.getSellerId();

            List<ChatRead> reads = List.of(
                    ChatRead.builder()
                            .message(saved)
                            .userId(buyerId)
                            .read(false)
                            .build(),
                    ChatRead.builder()
                            .message(saved)
                            .userId(sellerId)
                            .read(false)
                            .build()
            );
            chatReadRepository.saveAll(reads);

            // ✅ 마지막 메시지 시간 갱신
            room.setUpdatedAt(LocalDateTime.now());

            // ✅ WebSocket 실시간 전송
            simpMessagingTemplate.convertAndSend(
                    "/sub/chat/room/" + room.getId(),
                    ChatMessageDto.from(saved)
            );

            //실시간 WebSocket 송신
            simpMessagingTemplate.convertAndSend("/sub/chat/room/" + room.getId(), ChatMessageDto.from(saved));
            simpMessagingTemplate.convertAndSend("/sub/chat/user/" + room.getBuyerId(), ChatMessageDto.from(saved));
            simpMessagingTemplate.convertAndSend("/sub/chat/user/" + room.getSellerId(), ChatMessageDto.from(saved));

            //FCM
            try {
                String title = "📦 시스템 알림";
                String body = content;
                String clickAction = "/safe-items/" + room.getItem().getId();

                fcmService.sendToUser(room.getBuyerId(), title, body, clickAction, room.getId());
                fcmService.sendToUser(room.getSellerId(), title, body, clickAction, room.getId());
            } catch (Exception e) {
                log.error("❌ 시스템 메시지 FCM 전송 실패 (roomId={}): {}", room.getId(), e.getMessage());
            }
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendSystemMessageForAuction(Long auctionItemId, String content) {
        List<ChatRoom> rooms = chatRoomRepository.findByAuctionItem_Id(auctionItemId);

        // ✅ 채팅방이 없으면 자동 생성
        if (rooms.isEmpty()) {
            AuctionItem auctionItem = auctionItemRepository.findById(auctionItemId)
                    .orElseThrow(() -> new IllegalArgumentException("경매상품이 존재하지 않습니다."));

            Long sellerId = auctionItem.getSellerId();
            Long buyerId = auctionItem.getWinnerId();

            if (buyerId == null) {
                log.warn("⚠️ 시스템 메시지를 보낼 수 없습니다 (buyerId 없음, auctionItemId={})", auctionItemId);
                return;
            }

            ChatRoom newRoom = ChatRoom.builder()
                    .auctionItem(auctionItem)
                    .buyerId(buyerId)
                    .sellerId(sellerId)
                    .updatedAt(LocalDateTime.now())
                    .build();

            chatRoomRepository.save(newRoom);
            rooms = List.of(newRoom);
            log.info("✅ 경매 채팅방 자동 생성 → roomId={}, auctionItemId={}", newRoom.getId(), auctionItemId);
        }

        for (ChatRoom room : rooms) {
            ChatMessage systemMsg = ChatMessage.builder()
                    .room(room)
                    .senderId(0L)
                    .content(content)
                    .type(ChatMessage.MessageType.SYSTEM)
                    .createdAt(LocalDateTime.now())
                    .build();

            ChatMessage saved = chatMessageRepository.save(systemMsg);

            // ✅ 읽음처리
            List<ChatRead> reads = List.of(
                    ChatRead.builder().message(saved).userId(room.getBuyerId()).read(false).build(),
                    ChatRead.builder().message(saved).userId(room.getSellerId()).read(false).build()
            );
            chatReadRepository.saveAll(reads);

            room.setUpdatedAt(LocalDateTime.now());

            // ✅ 실시간 전송
            simpMessagingTemplate.convertAndSend("/sub/chat/room/" + room.getId(), ChatMessageDto.from(saved));
            simpMessagingTemplate.convertAndSend("/sub/chat/user/" + room.getBuyerId(), ChatMessageDto.from(saved));
            simpMessagingTemplate.convertAndSend("/sub/chat/user/" + room.getSellerId(), ChatMessageDto.from(saved));

            // ✅ FCM
            try {
                String title = "📦 경매 시스템 알림";
                String body = content;
                String clickAction = "/auction/" + room.getAuctionItem().getId();

                fcmService.sendToUser(room.getBuyerId(), title, body, clickAction, room.getId());
                fcmService.sendToUser(room.getSellerId(), title, body, clickAction, room.getId());
            } catch (Exception e) {
                log.error("❌ 경매 시스템 FCM 전송 실패 (roomId={}): {}", room.getId(), e.getMessage());
            }
        }
    }

}
