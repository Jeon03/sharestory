package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.FavoriteItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FavoriteItemRepository extends JpaRepository<FavoriteItem, Long> {
    Optional<FavoriteItem> findByUserIdAndItemId(Long userId, Long itemId);
    void deleteByUserIdAndItemId(Long userId, Long itemId);
}
