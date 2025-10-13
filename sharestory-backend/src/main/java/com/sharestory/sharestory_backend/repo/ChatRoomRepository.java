package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findByItem_IdAndBuyerId(Long itemId, Long buyerId);
    List<ChatRoom> findByBuyerIdOrSellerId(Long buyerId, Long sellerId);
    List<ChatRoom> findByItem_Id(Long itemId);
    List<ChatRoom> findByAuctionItem_Id(Long auctionItemId);

}