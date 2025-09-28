package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.*;
import com.sharestory.sharestory_backend.dto.*;
import com.sharestory.sharestory_backend.repo.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
@Slf4j
@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final ItemImageRepository itemImageRepository;
    private final S3Service s3Service;
    private final ItemSearchIndexer itemSearchIndexer;
    private final FavoriteItemRepository favoriteItemRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final SimpMessagingTemplate simpMessagingTemplate;
    private final ChatReadRepository chatReadRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final PointHistoryRepository pointHistoryRepository;
    private final UserRepository userRepository;

    @Transactional
    public Item registerItem(ItemRequestDto dto, List<MultipartFile> images, Long userId) throws IOException {
        // 0) 방어적 처리
        List<MultipartFile> safeImages = images == null ? Collections.emptyList() : images;
        if (safeImages.size() > 3) {
            throw new IllegalArgumentException("이미지는 최대 3장까지 업로드할 수 있습니다.");
        }

        // 1) Item 먼저 저장 (ID 필요하므로 saveAndFlush 권장)
        Item item = Item.builder()
                .title(dto.getTitle())
                .category(dto.getCategory())
                .status(ItemStatus.ON_SALE)
                .condition(dto.getCondition())
                .price(dto.getPrice())
                .description(dto.getDescription())
                .dealInfo(dto.getDealInfo())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .userId(userId)
                .createdDate(LocalDateTime.now())
                .build();

        itemRepository.saveAndFlush(item); // ID 채번 보장

        // 2) 이미지 업로드 (S3는 트랜잭션 바깥이므로 보상 고려)
        List<String> uploadedUrls = new ArrayList<>();
        try {
            for (MultipartFile file : safeImages) {
                if (file == null || file.isEmpty()) continue;
                String url = s3Service.uploadFile(file, "items/" + item.getId());
                uploadedUrls.add(url);
            }
        } catch (Exception e) {
            // 보상: 이미 업로드된 객체 삭제(가능하면 key도 따로 저장해서 deleteByKey 사용)
            // 여기서는 URL에서 key를 파싱하기 어렵다고 가정 → 필요 시 S3Service가 key를 리턴하도록 변경 권장
            // s3Service.deleteByKey(key);
            throw e;
        }

        // 3) ItemImage 엔티티 생성/저장 (배치 저장)
        List<ItemImage> imageEntities = IntStream.range(0, uploadedUrls.size())
                .mapToObj(i -> ItemImage.builder()
                        .item(item)
                        .url(uploadedUrls.get(i))
                        .sortOrder(i)
                        .build())
                .collect(Collectors.toList());

        if (!imageEntities.isEmpty()) {
            itemImageRepository.saveAll(imageEntities);
            // 양방향 매핑 사용 시 컬렉션도 갱신
            item.getImages().addAll(imageEntities);
            // 대표 이미지(첫 장)
            item.setImageUrl(uploadedUrls.get(0));
            // 명시 저장은 선택(영속 상태라 flush로 반영됨)
            // itemRepository.save(item);
        }

        itemSearchIndexer.indexItem(item);

        return item;
    }

    @Transactional
    public void updateItem(Long itemId,
                           ItemRequestDto dto,
                           List<MultipartFile> images,        // 새로 추가할 이미지
                           List<Long> deletedImageIds,        // 삭제할 기존 이미지 ID
                           Long userId) throws IOException {

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다."));

        if (!item.getUserId().equals(userId)) {
            throw new SecurityException("수정 권한이 없습니다.");
        }

        // 상품 필드 수정
        item.setTitle(dto.getTitle());
        item.setCategory(dto.getCategory());
        item.setCondition(dto.getCondition());
        item.setPrice(dto.getPrice());
        item.setDescription(dto.getDescription());
        item.setDealInfo(dto.getDealInfo());
        item.setLatitude(dto.getLatitude());
        item.setLongitude(dto.getLongitude());
        item.setUpdatedDate(LocalDateTime.now());
        item.setModified(true);

        // ✅ 삭제할 이미지가 있다면 S3 + DB에서 제거
        if (deletedImageIds != null && !deletedImageIds.isEmpty()) {
            List<ItemImage> toDelete = itemImageRepository.findAllById(deletedImageIds);
            for (ItemImage img : toDelete) {
                try {
                    String key = s3Service.extractKeyFromUrl(img.getUrl());
                    if (key != null) s3Service.deleteByKey(key);
                } catch (Exception e) {
                    System.err.println("[S3 DELETE FAIL] " + img.getUrl() + " : " + e.getMessage());
                }
            }
            itemImageRepository.deleteAll(toDelete);
            item.getImages().removeAll(toDelete);
        }

        // ✅ 새로운 이미지 등록 (있을 때만)
        if (images != null && !images.isEmpty()) {
            List<ItemImage> newImageEntities = new ArrayList<>();
            for (int i = 0; i < images.size(); i++) {
                MultipartFile file = images.get(i);
                if (file == null || file.isEmpty()) continue;

                String url = s3Service.uploadFile(file, "items/" + item.getId());
                ItemImage newImg = ItemImage.builder()
                        .item(item)
                        .url(url)
                        .sortOrder(item.getImages().size() + i) // 기존 이미지 뒤에 붙임
                        .build();
                newImageEntities.add(newImg);
            }
            itemImageRepository.saveAll(newImageEntities);
            item.getImages().addAll(newImageEntities);
        }

        // ✅ 대표 이미지 갱신 (남아있는 이미지 중 첫 번째)
        if (!item.getImages().isEmpty()) {
            item.setImageUrl(item.getImages().get(0).getUrl());
        } else {
            item.setImageUrl(null); // 이미지가 전부 삭제된 경우
        }

        // 검색 인덱스 갱신
        itemSearchIndexer.indexItem(item);

        // ✅ 채팅방 참여자에게 실시간 상품 업데이트 전송
        List<ChatRoom> rooms = chatRoomRepository.findByItem_Id(itemId);
        for (ChatRoom room : rooms) {
            ItemUpdateMessage updateMessage = new ItemUpdateMessage(
                    room.getId(),
                    item.getId(),
                    item.getTitle(),
                    item.getPrice(),
                    item.getImageUrl(),
                    item.getDescription()
            );

            simpMessagingTemplate.convertAndSend(
                    "/sub/chat/room/" + room.getId() + "/item",
                    updateMessage
            );
        }
    }


    @Transactional
    public void deleteItem(Long itemId, Long userId) {
        // 1) 상품 조회
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다."));

        if (!item.getUserId().equals(userId)) {
            throw new SecurityException("삭제 권한이 없습니다.");
        }

        // 2) 채팅방 및 메시지 삭제 (읽음 기록 포함)
        List<ChatRoom> rooms = chatRoomRepository.findByItem_Id(itemId);
        for (ChatRoom room : rooms) {
            // (1) 채팅 메시지 중 IMAGE 타입은 S3에서도 삭제
            for (ChatMessage msg : room.getMessages()) {
                if (msg.getType() == ChatMessage.MessageType.IMAGE) {
                    try {
                        String key = s3Service.extractKeyFromUrl(msg.getContent());
                        if (key != null) {
                            s3Service.deleteByKey(key);
                        }
                    } catch (Exception e) {
                        log.error("[S3 DELETE FAIL] ChatMessage image {} : {}", msg.getContent(), e.getMessage());
                    }
                }
            }

            // (2) 읽음 기록 제거
            chatReadRepository.deleteAllByRoomId(room.getId());

            // (3) 메시지 제거
            chatMessageRepository.deleteAllByRoomId(room.getId());
        }

        // (4) 채팅방 제거
        chatRoomRepository.deleteAll(rooms);


        // 5) 상품 이미지 S3 제거
        if (item.getImages() != null && !item.getImages().isEmpty()) {
            for (ItemImage img : item.getImages()) {
                try {
                    String key = s3Service.extractKeyFromUrl(img.getUrl());
                    if (key != null) {
                        s3Service.deleteByKey(key);
                        log.info("[S3 DELETE SUCCESS] key={}", key);
                    }
                } catch (Exception e) {
                    log.error("[S3 DELETE FAIL] url={} err={}", img.getUrl(), e.getMessage());
                }
            }
        }

        // 6) 상품 이미지 DB 제거
        itemImageRepository.deleteAllByItemId(itemId);
        // 6.5) 관심상품 제거
        favoriteItemRepository.deleteAllByItemId(itemId);
        // 7) 상품 자체 DB 제거
        itemRepository.delete(item);

        // 8) ES 인덱스 제거
        itemSearchIndexer.deleteItem(itemId);

        log.info("[ITEM DELETE COMPLETE] itemId={}", itemId);
    }


    @Transactional(readOnly = true)
    public List<String> getImageUrls(Long itemId) {
        return itemImageRepository.findByItemIdOrderBySortOrderAsc(itemId).stream()
                .map(ItemImage::getUrl)
                .collect(Collectors.toList()); // (Java 16+면 .toList() 가능
    }

    @Transactional
    public void updateStatus(Long itemId, ItemStatus status, Long userId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다."));

        if (!item.getUserId().equals(userId)) {
            throw new SecurityException("판매자만 상태를 변경할 수 있습니다.");
        }

        item.setStatus(status);

        // 🔔 선택: 상태 변경 시 채팅방 참여자에게 알림 보내기
        List<ChatRoom> rooms = chatRoomRepository.findByItem_Id(itemId);
        for (ChatRoom room : rooms) {
            simpMessagingTemplate.convertAndSend(
                    "/sub/chat/room/" + room.getId() + "/status",
                    status.name()
            );
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getChatRoomsForItem(Long itemId, Long sellerId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다."));

        if (!item.getUserId().equals(sellerId)) {
            throw new SecurityException("판매자만 채팅방을 조회할 수 있습니다.");
        }

        List<ChatRoom> rooms = chatRoomRepository.findByItem_Id(itemId);

        return rooms.stream()
                .map(room -> {
                    Map<String, Object> dto = new HashMap<>();
                    dto.put("roomId", room.getId());
                    dto.put("buyerId", room.getBuyerId());

                    // ✅ 구매자 닉네임
                    userRepository.findById(room.getBuyerId())
                            .ifPresent(user -> dto.put("buyerName", user.getNickname()));

                    // ✅ 최근 메시지
                    chatMessageRepository.findTopByRoomOrderByCreatedAtDesc(room)
                            .ifPresent(msg -> {
                                dto.put("lastMessage", msg.getContent());
                                dto.put("lastMessageType", msg.getType().name()); // TEXT / IMAGE / LOCATION
                            });

                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void reserveItem(Long itemId, Long sellerId, Long buyerId, Long roomId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다."));

        if (!item.getUserId().equals(sellerId)) {
            throw new SecurityException("판매자만 예약할 수 있습니다.");
        }

        // ✅ 구매자 조회
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new IllegalArgumentException("구매자가 존재하지 않습니다."));

        // ✅ 상태 변경
        item.setStatus(ItemStatus.RESERVED);

        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방이 존재하지 않습니다."));

        // ✅ SYSTEM 메시지 저장
        ChatMessage systemMsg = ChatMessage.builder()
                .room(room)
                .senderId(sellerId)
                .content("판매자가 " + buyer.getNickname() + "님과 예약을 확정했습니다.")
                .type(ChatMessage.MessageType.SYSTEM)
                .createdAt(LocalDateTime.now())
                .build();

        ChatMessage saved = chatMessageRepository.save(systemMsg);

        // ✅ SYSTEM 메시지는 구매자만 안읽음 처리
        ChatRead chatRead = ChatRead.builder()
                .message(saved)
                .userId(buyerId)   // 구매자만 읽음 대상
                .read(false)
                .build();
        chatReadRepository.save(chatRead);

        // ✅ 마지막 메시지 시간 갱신
        room.setUpdatedAt(LocalDateTime.now());

        // ✅ WebSocket 브로드캐스트
        simpMessagingTemplate.convertAndSend(
                "/sub/chat/room/" + roomId,
                ChatMessageDto.from(saved)   // DTO로 변환해서 내려주는 게 프론트에서 받기 편함
        );
    }

    @Transactional
    public void completeSale(Long itemId, Long sellerId, Long buyerId, Long roomId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다."));

        if (!item.getUserId().equals(sellerId)) {
            throw new SecurityException("판매자만 판매완료 처리할 수 있습니다.");
        }

        // ✅ 구매자 조회
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new IllegalArgumentException("구매자가 존재하지 않습니다."));

        // ✅ 상태 변경
        item.setStatus(ItemStatus.SOLD_OUT);

        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방이 존재하지 않습니다."));

        // ✅ SYSTEM 메시지 저장
        ChatMessage systemMsg = ChatMessage.builder()
                .room(room)
                .senderId(sellerId)
                .content("판매가 완료되었습니다. 구매자: " + buyer.getNickname() + "님")
                .type(ChatMessage.MessageType.SYSTEM)
                .createdAt(LocalDateTime.now())
                .build();

        ChatMessage saved = chatMessageRepository.save(systemMsg);

        // ✅ SYSTEM 메시지는 구매자만 안읽음 처리
        ChatRead chatRead = ChatRead.builder()
                .message(saved)
                .userId(buyerId)   // 구매자만 읽음 대상
                .read(false)
                .build();
        chatReadRepository.save(chatRead);

        // ✅ 마지막 메시지 시간 갱신
        room.setUpdatedAt(LocalDateTime.now());

        // ✅ WebSocket 브로드캐스트
        simpMessagingTemplate.convertAndSend(
                "/sub/chat/room/" + roomId,
                ChatMessageDto.from(saved)
        );
    }

    public List<ItemSummaryDto> getMyItems(Long userId) {
        List<Item> items = itemRepository.findByUserId(userId);

        return items.stream()
                .map(item -> ItemSummaryDto.builder()
                        .id(item.getId())
                        .title(item.getTitle())
                        .price(item.getPrice())
                        .imageUrl(item.getImageUrl())
                        .createdDate(item.getCreatedDate().toString())
                        .itemStatus(item.getStatus().name())
                        .favoriteCount(item.getFavoriteCount())
                        .viewCount(item.getViewCount())
                        .chatRoomCount(item.getChatRoomCount())
                        .latitude(item.getLatitude())
                        .longitude(item.getLongitude())
                        .modified(item.isModified())
                        .updatedDate(item.getUpdatedDate() != null ? item.getUpdatedDate().toString() : null)
                        .build())
                .toList();
    }

    public List<ItemSummaryDto> getSafeTradeItemsForBuyer(Long buyerId) {
        List<ItemStatus> statuses = List.of(
                ItemStatus.SAFE_PENDING,
                ItemStatus.SAFE_READY,
                ItemStatus.SAFE_START,
                ItemStatus.SAFE_ING,
                ItemStatus.SAFE_COMPLETE
        );

        return itemRepository.findByBuyerIdAndStatusIn(buyerId, statuses)
                .stream()
                .map(this::toSummaryDto)
                .toList();
    }

    public List<ItemSummaryDto> getSafeTradeItemsForSeller(Long sellerId) {
        List<ItemStatus> statuses = List.of(
                ItemStatus.SAFE_PENDING,
                ItemStatus.SAFE_READY,
                ItemStatus.SAFE_START,
                ItemStatus.SAFE_ING,
                ItemStatus.SAFE_COMPLETE
        );

        return itemRepository.findBySellerIdAndStatusIn(sellerId, statuses)
                .stream()
                .map(this::toSummaryDto)
                .toList();
    }

    private ItemSummaryDto toSummaryDto(Item item) {
        return ItemSummaryDto.builder()
                .id(item.getId())
                .title(item.getTitle())
                .price(item.getPrice())
                .imageUrl(item.getImageUrl())
                .createdDate(item.getCreatedDate() != null ? item.getCreatedDate().toString() : null)
                .itemStatus(item.getStatus().name())
                .favoriteCount(item.getFavoriteCount())
                .viewCount(item.getViewCount())
                .chatRoomCount(item.getChatRoomCount())
                .latitude(item.getLatitude())
                .longitude(item.getLongitude())
                .modified(item.isModified())
                .updatedDate(item.getUpdatedDate() != null ? item.getUpdatedDate().toString() : null)
                .dealInfo(item.getDealInfo())
                .build();
    }

}
