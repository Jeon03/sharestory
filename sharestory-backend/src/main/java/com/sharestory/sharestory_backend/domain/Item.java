package com.sharestory.sharestory_backend.domain;

import com.sharestory.sharestory_backend.dto.ItemStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;          // 상품명
    private String category;       // 카테고리
    private int price;             // 가격

    @Column(length = 2000)
    private String description;    // 설명

    @Embedded
    private DealInfo dealInfo;

    private Double latitude;       // 위도
    private Double longitude;      // 경도

    @Column(name = "item_condition")
    private String condition;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_status", nullable = false, length = 50)
    private ItemStatus status;

    //@CreatedDate
    @Column(name = "created_date", nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;   // 수정일

    @Column(name = "is_modified", nullable = false)
    private boolean isModified = false;  // 수정 여부

    // ✅ 다중 이미지 매핑
    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<ItemImage> images = new ArrayList<>();

    private String imageUrl;   // 대표 이미지 (첫 번째 이미지 S3 URL)

    private Long userId;       // 등록자 ID (User FK 예정)

    @Column(name = "favorite_count")
    private Integer favoriteCount = 0;

    @Builder.Default
    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;

    @Builder.Default
    @Column(name = "chat_room_count", nullable = false)
    private Integer chatRoomCount = 0;

    private Long sellerId;
    private Long buyerId;

    /* =========================== */
    /* ✅ Cascade 삭제 연관관계 추가 */
    /* =========================== */

    // 주문들 (Order)
    @OneToOne(mappedBy = "item", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private Order orders;

    // 관심상품 (FavoriteItem)
    @OneToMany(mappedBy = "item", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<FavoriteItem> favorites = new ArrayList<>();

    // 채팅방 (ChatRoom)
    @OneToMany(mappedBy = "item", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<ChatRoom> chatRooms = new ArrayList<>();

    // 배송 추적 (DeliveryTracking)
    @OneToOne(mappedBy = "item", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private DeliveryTracking deliveryTracking;

    @PrePersist
    void prePersist() {
        if (favoriteCount == null) favoriteCount = 0;
        if (viewCount == null) viewCount = 0;
        if (chatRoomCount == null) chatRoomCount = 0;
    }
}
