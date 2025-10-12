package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.Item;
import com.sharestory.sharestory_backend.domain.Order;
import com.sharestory.sharestory_backend.dto.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;


public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByStatus(OrderStatus status);
    List<Order> findByStatusAndAuctionItemIdNotNull(OrderStatus status);
    Optional<Order> findByItem_Id(Long itemId);
    boolean existsByItem_Id(Long itemId);
    Optional<Order> findByAuctionItemId(Long auctionItemId);
    Optional<Order> findByAuctionItem_Id(Long auctionItemId);

}