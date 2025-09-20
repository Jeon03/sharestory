package com.sharestory.sharestory_backend.dto;

import com.sharestory.sharestory_backend.domain.ChatRoom;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
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
        return ChatRoomDto.builder()
                .roomId(room.getId())
                .itemTitle(room.getItem().getTitle())
                .partnerName(partnerName)
                .lastMessage(lastMessage)
                .updatedAt(room.getUpdatedAt())
                .itemThumbnail(room.getItem().getImageUrl())  // Item 엔티티에 대표이미지 URL 있음
                .itemPrice(room.getItem().getPrice())
                .build();
    }


    public static ChatRoomDto from(ChatRoom room, String partnerName, String lastMessage, int unreadCount) {
        return ChatRoomDto.builder()
                .roomId(room.getId())
                .itemTitle(room.getItem().getTitle())
                .partnerName(partnerName)
                .lastMessage(lastMessage)
                .updatedAt(room.getUpdatedAt())
                .itemThumbnail(room.getItem().getImageUrl())  // Item 엔티티에 대표이미지 URL 있음
                .itemPrice(room.getItem().getPrice())
                .unreadCount(unreadCount)
                .build();
    }
}
