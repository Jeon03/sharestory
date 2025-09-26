package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.FavoriteItem;
import com.sharestory.sharestory_backend.domain.Item;
import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.dto.ItemSummaryDto;
import com.sharestory.sharestory_backend.repo.FavoriteItemRepository;
import com.sharestory.sharestory_backend.repo.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FavoriteItemService {

    private final FavoriteItemRepository favoriteRepo;
    private final ItemRepository itemRepo;

    @Transactional
    public int toggleFavorite(Long userId, Long itemId) {
        Item item = itemRepo.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        Optional<FavoriteItem> existing = favoriteRepo.findByUserIdAndItemId(userId, itemId);

        if (existing.isPresent()) {
            // 관심 취소
            favoriteRepo.delete(existing.get());
            item.setFavoriteCount(item.getFavoriteCount() - 1);
        } else {
            // 관심 등록
            FavoriteItem fav = FavoriteItem.builder()
                    .user(User.builder().id(userId).build()) // id만 세팅
                    .item(item)
                    .build();
            favoriteRepo.save(fav);
            item.setFavoriteCount(item.getFavoriteCount() + 1);
        }

        // JPA dirty checking 으로 자동 UPDATE 됨 (@Transactional 덕분)
        return item.getFavoriteCount();
    }

    @Transactional(readOnly = true)
    public boolean isFavorite(Long userId, Long itemId) {
        return favoriteRepo.findByUserIdAndItemId(userId, itemId).isPresent();
    }

    @Transactional(readOnly = true)
    public int getFavoriteCount(Long itemId) {
        return itemRepo.findById(itemId)
                .map(Item::getFavoriteCount)
                .orElse(0);
    }

    @Transactional(readOnly = true)
    public List<ItemSummaryDto> getFavorites(Long userId) {
        return favoriteRepo.findByUserId(userId).stream()
                .map(fav -> {
                    var item = fav.getItem();

                    // 대표 이미지 1개만 선택 (없으면 null)
                    String imageUrl = (item.getImages() != null && !item.getImages().isEmpty())
                            ? item.getImages().get(0).getUrl()
                            : null;

                    return ItemSummaryDto.builder()
                            .id(item.getId())
                            .title(item.getTitle())
                            .price(item.getPrice())
                            .imageUrl(imageUrl)
                            .itemStatus(item.getStatus().name())
                            .favoriteCount(item.getFavoriteCount())
                            .latitude(item.getLatitude())
                            .longitude(item.getLongitude())
                            .modified(item.isModified())
                            .build();
                })
                .toList();
    }
}
