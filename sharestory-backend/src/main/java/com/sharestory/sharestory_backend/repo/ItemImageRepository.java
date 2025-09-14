package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.ItemImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemImageRepository extends JpaRepository<ItemImage, Long> {
    List<ItemImage> findByItemIdOrderBySortOrderAsc(Long itemId);
    void deleteAllByItemId(Long itemId);
}
