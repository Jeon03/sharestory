package com.sharestory.sharestory_backend.admin;

import com.sharestory.sharestory_backend.domain.ChatRoom;
import com.sharestory.sharestory_backend.domain.Item;
import com.sharestory.sharestory_backend.repo.ChatMessageRepository;
import com.sharestory.sharestory_backend.repo.ChatReadRepository;
import com.sharestory.sharestory_backend.repo.ChatRoomRepository;
import com.sharestory.sharestory_backend.repo.ItemRepository;
import com.sharestory.sharestory_backend.service.S3Service;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminItemService {

    private final ItemRepository itemRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatReadRepository chatReadRepository;
    private final S3Service s3Service;

    @Transactional
    public void deleteItemCompletely(Long itemId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("상품 없음"));

        // ✅ 관련 채팅방 전체 조회
        List<ChatRoom> rooms = chatRoomRepository.findByItem_Id(itemId);

        for (ChatRoom room : rooms) {
            // ✅ 채팅 메시지 id 목록 추출
            List<Long> messageIds = chatMessageRepository.findIdsByRoomId(room.getId());

            if (!messageIds.isEmpty()) {
                // ✅ 읽음 기록 삭제
                chatReadRepository.deleteAllByMessageIds(messageIds);

                // ✅ 메시지 삭제
                chatMessageRepository.deleteAllByRoom_Id(room.getId());
            }

            // ✅ 채팅방 삭제
            chatRoomRepository.delete(room);
        }

        // ✅ 이미지 S3에서 삭제
        if (item.getImages() != null) {
            item.getImages().forEach(img -> {
                s3Service.deleteFile(img.getUrl());
            });
        }

        // ✅ DB에서 상품 삭제
        itemRepository.delete(item);
    }
}
