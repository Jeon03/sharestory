package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.dto.AuctionStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;


@Repository
public interface AuctionItemRepository extends JpaRepository<AuctionItem, Long> {

    // 🔒 비관적 락으로 아이템 조회
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM AuctionItem a WHERE a.id = :id")
    Optional<AuctionItem> findByIdForUpdate(@Param("id") Long id);
    List<AuctionItem> findByStatusAndEndDateTimeBefore(AuctionStatus status, LocalDateTime now);
}
