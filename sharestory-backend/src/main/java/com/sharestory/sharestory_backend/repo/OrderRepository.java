package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.Order;
import com.sharestory.sharestory_backend.dto.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByBuyerId(Long buyerId);
    List<Order> findBySellerId(Long sellerId);
    List<Order> findByBuyerIdOrSellerIdAndStatusIn(Long buyerId, Long sellerId, List<OrderStatus> statuses);
}