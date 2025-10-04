package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.Item;
import com.sharestory.sharestory_backend.dto.ItemStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    Page<Item> findByStatus(ItemStatus status, Pageable pageable);
    Page<Item> findByStatusIn(List<ItemStatus> statuses, Pageable pageable);
    @EntityGraph(attributePaths = {"images"})
    Optional<Item> findWithImagesById(Long id);

    @Modifying
    @Query("update Item i set i.viewCount = i.viewCount + 1 where i.id = :id")
    void incrementViewCount(@Param("id") Long id);

    List<Item> findByUserId(Long userId);

    List<Item> findByBuyerIdAndStatusIn(Long buyerId, Collection<ItemStatus> statuses);

    // 로그인한 유저가 구매자로 참여 중인 안전거래
    List<Item> findByBuyerIdAndStatusIn(Long buyerId, List<ItemStatus> statuses);

    // 로그인한 유저가 판매자로 참여 중인 안전거래
    List<Item> findBySellerIdAndStatusIn(Long sellerId, List<ItemStatus> statuses);

    List<Item> findByBuyerIdOrSellerIdAndStatusIn(Long buyerId, Long sellerId, List<ItemStatus> statuses);

}
