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

import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    Page<Item> findByStatus(ItemStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"images"})
    Optional<Item> findWithImagesById(Long id);

    @Modifying
    @Query("update Item i set i.viewCount = i.viewCount + 1 where i.id = :id")
    void incrementViewCount(@Param("id") Long id);

}
