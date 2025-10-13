package com.sharestory.sharestory_backend.dto;

import com.sharestory.sharestory_backend.domain.ChatRoom;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRoomDto {
    private Long roomId;
    private String itemTitle;
    private String partnerName;
    private String lastMessage;
    private LocalDateTime updatedAt;
    private String itemThumbnail; // 대표 이미지
    private int itemPrice;
    private int unreadCount;

    public static ChatRoomDto from(ChatRoom room, String partnerName, String lastMessage) {
        return from(room, partnerName, lastMessage, 0);
    }

    public static ChatRoomDto from(ChatRoom room, String partnerName, String lastMessage, int unreadCount) {
        String title;
        String thumbnail;
        int price;

        // ✅ 일반 상품 채팅방
        if (room.getItem() != null) {
            title = room.getItem().getTitle();
            thumbnail = room.getItem().getImageUrl();
            price = room.getItem().getPrice();
        }
        // ✅ 경매 상품 채팅방
        else if (room.getAuctionItem() != null) {
            title = "[경매] " + room.getAuctionItem().getTitle();
            thumbnail = room.getAuctionItem().getMainImageUrl();
            price = room.getAuctionItem().getCurrentPrice();
        }
        // ✅ 안전 장치 (둘 다 null일 경우)
        else {
            title = "(삭제된 상품)";
            thumbnail = null;
            price = 0;
        }

        return ChatRoomDto.builder()
                .roomId(room.getId())
                .itemTitle(title)
                .partnerName(partnerName)
                .lastMessage(lastMessage)
                .updatedAt(room.getUpdatedAt())
                .itemThumbnail(thumbnail)
                .itemPrice(price)
                .unreadCount(unreadCount)
                .build();
    }
}
