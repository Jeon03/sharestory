package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.DeliveryTracking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DeliveryTrackingRepository extends JpaRepository<DeliveryTracking, Long> {
    // ✅ Item 엔티티의 id로 DeliveryTracking 조회
    Optional<DeliveryTracking> findByItem_Id(Long itemId);

    // 이미 등록 여부 체크용
    boolean existsByItem_Id(Long itemId);
}
