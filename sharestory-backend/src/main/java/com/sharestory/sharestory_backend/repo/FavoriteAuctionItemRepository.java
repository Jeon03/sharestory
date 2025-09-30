package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.domain.FavoriteAuctionItem;
import com.sharestory.sharestory_backend.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FavoriteAuctionItemRepository extends JpaRepository<FavoriteAuctionItem, Long> {

    Optional<FavoriteAuctionItem> findByUserAndAuctionItem(User user, AuctionItem auctionItem);

    boolean existsByUserIdAndAuctionItemId(Long userId, Long auctionItemId);

    void deleteAllByAuctionItemId(Long auctionItemId);
}