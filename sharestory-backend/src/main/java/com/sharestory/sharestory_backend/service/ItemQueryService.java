package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.Item;
import com.sharestory.sharestory_backend.dto.ItemDetailResponse;
import com.sharestory.sharestory_backend.dto.ItemStatus;
import com.sharestory.sharestory_backend.dto.ItemSummaryDto;
import com.sharestory.sharestory_backend.repo.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemQueryService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ItemRepository itemRepository;
    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final ItemStatus ON_SALE = ItemStatus.ON_SALE;

    public Page<Item> getOnSalePage(int page, int size) {
        Pageable pageable = PageRequest.of(
                page, size,
                Sort.by(Sort.Direction.DESC, "createdDate").and(Sort.by(Sort.Direction.DESC, "id"))
        );
        return itemRepository.findByStatus(ItemStatus.ON_SALE, pageable);
    }

    /** 최신순  */
    public List<ItemSummaryDto> getLatest(int size) {
        Pageable pageable = PageRequest.of(0, size,
                Sort.by(Sort.Direction.DESC, "createdDate").and(Sort.by("id").descending()));

        Page<Item> page = itemRepository.findByStatus(ON_SALE, pageable); // enum 버전
        return page.map(this::toSummary).getContent();
    }

    /** 관심 많은 순 (favoriteCount DESC) */
    public List<ItemSummaryDto> getFavorites(int size) {
        Pageable pageable = PageRequest.of(0, size,
                Sort.by(Sort.Direction.DESC, "favoriteCount").and(Sort.by("id").descending()));
        Page<Item> page = itemRepository.findByStatus(ON_SALE, pageable); // enum 버전
        return page.map(this::toSummary).getContent();
    }

    /** 많이 본 순 (viewCount DESC) */
    public List<ItemSummaryDto> getViews(int size) {
        Pageable pageable = PageRequest.of(0, size,
                Sort.by(Sort.Direction.DESC, "viewCount").and(Sort.by("id").descending()));
        return itemRepository.findByStatus(ON_SALE, pageable).map(this::toSummary).getContent();
    }

    /** 전체 리스트(페이지네이션) — 프론트는 여기서 전부 받고 12개만 사용 */
    public List<ItemSummaryDto> getAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "createdDate").and(Sort.by("id").descending()));
        return itemRepository.findByStatus(ON_SALE, pageable).map(this::toSummary).getContent();
    }

    @Transactional
    public void increaseViewCount(Long itemId, Long userId, String ipAddress) {
        // 로그인 사용자 → userId 기준
        String key;
        if (userId != null && userId > 0) {
            key = "view:" + itemId + ":user:" + userId;
        } else {
            key = "view:" + itemId + ":ip:" + ipAddress;
        }

        Boolean alreadyViewed = redisTemplate.hasKey(key);

        if (Boolean.FALSE.equals(alreadyViewed)) {
            itemRepository.incrementViewCount(itemId);
            redisTemplate.opsForValue().set(key, "1", Duration.ofSeconds(10)); // TTL 10초
        }
    }

    public ItemDetailResponse getDetail(Long id) {
        Item item = itemRepository.findWithImagesById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found: " + id));

        // 대표 이미지 결정 (imageUrl 없으면 첫 번째 이미지)
        String cover = item.getImageUrl();
        if ((cover == null || cover.isBlank()) && item.getImages() != null && !item.getImages().isEmpty()) {
            cover = item.getImages().get(0).getUrl();
        }

        return ItemDetailResponse.builder()
                .id(item.getId())
                .userId(item.getUserId())
                .sellerId(item.getSellerId())
                .buyerId(item.getBuyerId())
                .title(item.getTitle())
                .price(item.getPrice())
                .description(item.getDescription())
                .category(item.getCategory())
                .createdDate(item.getCreatedDate() != null ? item.getCreatedDate().format(ISO) : null)
                .condition(item.getCondition())
                .itemStatus(item.getStatus().name())
                .imageUrl(cover)
                .images(item.getImages() == null ? List.of()
                        : item.getImages().stream().map(img -> img.getUrl()).collect(Collectors.toList()))
                .latitude(item.getLatitude())
                .longitude(item.getLongitude())
                .dealInfo(item.getDealInfo())
                .modified(item.isModified())
                .updatedDate(item.getUpdatedDate() != null ? item.getUpdatedDate().format(ISO) : null)
                .build();
    }

    private ItemSummaryDto toSummary(Item item) {
        // 대표 이미지 결정: item.imageUrl 우선, 없으면 연관 이미지 첫 장
        String thumb = item.getImageUrl();
        if ((thumb == null || thumb.isBlank()) && item.getImages() != null && !item.getImages().isEmpty()) {
            thumb = item.getImages().get(0).getUrl(); // isThumbnail 기준 있으면 그걸로 교체
        }
        return ItemSummaryDto.builder()
                .id(item.getId())
                .title(item.getTitle())
                .price(item.getPrice())
                .imageUrl(thumb)
                .createdDate(item.getCreatedDate() != null ? item.getCreatedDate().format(ISO) : null)
                .itemStatus(item.getStatus().name())
                .favoriteCount(item.getFavoriteCount())
                .viewCount(item.getViewCount())
                .chatRoomCount(item.getChatRoomCount())
                .latitude(item.getLatitude())
                .longitude(item.getLongitude())
                .modified(item.isModified())   // ✅ 수정 여부
                .updatedDate(item.getUpdatedDate() != null ? item.getUpdatedDate().toString() : null)
                .build();
    }
}
