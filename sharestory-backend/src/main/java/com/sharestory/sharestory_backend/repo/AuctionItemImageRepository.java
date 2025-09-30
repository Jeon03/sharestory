package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.AuctionItemImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuctionItemImageRepository extends JpaRepository<AuctionItemImage, Long> {

    /**
     * 특정 경매 상품 ID(auctionItemId)에 속한 모든 이미지를
     * sortOrder 필드 기준 오름차순으로 정렬하여 조회합니다.
     */
    List<AuctionItemImage> findByAuctionItemIdOrderBySortOrderAsc(Long auctionItemId);

    /**
     * 특정 경매 상품이 삭제될 때, 관련된 모든 이미지 정보를
     * 데이터베이스에서 한 번에 삭제하기 위한 메서드입니다.
     */
    void deleteAllByAuctionItemId(Long auctionItemId);
}