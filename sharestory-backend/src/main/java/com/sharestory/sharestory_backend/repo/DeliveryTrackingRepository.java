package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.DeliveryTracking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DeliveryTrackingRepository extends JpaRepository<DeliveryTracking, Long> {
    Optional<DeliveryTracking> findByItem_Id(Long itemId);
    boolean existsByItem_Id(Long itemId);
    Optional<DeliveryTracking> findByAuctionItem_Id(Long auctionItemId);
    boolean existsByAuctionItem_Id(Long auctionItemId);
    Optional<DeliveryTracking> findByOrder_Id(Long orderId);
}
