package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.AuctionImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuctionImageRepository extends JpaRepository<AuctionImage, Long> {

    List<AuctionImage> findAllByAuctionItem_Id(Long auctionItemId);
    void deleteAllByAuctionItemId(Long auctionItemId);
}