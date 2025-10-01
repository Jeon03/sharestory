package com.sharestory.sharestory_backend.admin;

import com.sharestory.sharestory_backend.domain.Item;
import com.sharestory.sharestory_backend.repo.ItemRepository;
import com.sharestory.sharestory_backend.service.S3Service;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminItemService {

    private final ItemRepository itemRepository;
    private final S3Service s3Service;

    @Transactional
    public void deleteItemCompletely(Long itemId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("상품 없음"));

        // ✅ 이미지 S3에서 삭제
        if (item.getImages() != null) {
            item.getImages().forEach(img -> {
                s3Service.deleteFile(img.getUrl());
            });
        }

        // ✅ DB에서 상품 삭제 (cascade 걸려있으면 연관 엔티티 같이 삭제됨)
        itemRepository.delete(item);
    }
}
