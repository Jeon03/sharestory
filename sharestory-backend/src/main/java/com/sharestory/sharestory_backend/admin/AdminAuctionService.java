package com.sharestory.sharestory_backend.admin;

import com.sharestory.sharestory_backend.repo.AuctionBidRepository;
import com.sharestory.sharestory_backend.repo.AuctionImageRepository;
import com.sharestory.sharestory_backend.repo.AuctionItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminAuctionService {

    private final AuctionItemRepository auctionItemRepository;
    private final AuctionBidRepository auctionBidRepository;
    private final AuctionImageRepository auctionImageRepository;

    @Transactional
    public void deleteAuctionCompletely(Long auctionId) {
        // ✅ 존재 여부 확인
        var item = auctionItemRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("해당 경매 상품을 찾을 수 없습니다."));

        // ✅ 1. 입찰 내역 삭제
        auctionBidRepository.deleteAllByAuctionItemId(auctionId);

        // ✅ 2. 이미지 삭제
        auctionImageRepository.deleteAllByAuctionItemId(auctionId);

        // ✅ 3. 아이템 삭제
        auctionItemRepository.delete(item);
    }
}
