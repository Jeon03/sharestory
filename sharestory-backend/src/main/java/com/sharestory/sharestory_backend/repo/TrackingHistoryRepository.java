package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.TrackingHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TrackingHistoryRepository extends JpaRepository<TrackingHistory, Long> {
    List<TrackingHistory> findByOrder_IdOrderByTimestampAsc(Long orderId);
}