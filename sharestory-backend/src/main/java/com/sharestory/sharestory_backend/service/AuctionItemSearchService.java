package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.dto.AuctionItemSummaryDto;
import com.sharestory.sharestory_backend.repo.AuctionItemRepository; // 패키지 경로를 repo로 수정
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class AuctionItemSearchService {

    private final AuctionItemRepository auctionItemRepository;

    public Page<AuctionItemSummaryDto> searchAuctionItemsByKeyword(String keyword, Pageable pageable) {
        Page<AuctionItem> auctionItems;

        if (keyword == null || keyword.isBlank()) {
            auctionItems = auctionItemRepository.findAll(pageable);
        } else {
            // 1번에서 Repository에 추가한 검색 메소드를 호출합니다.
            auctionItems = auctionItemRepository.findByTitleContainingIgnoreCase(keyword, pageable);
        }

        return auctionItems.map(this::convertToSummaryDto);
    }

    // AuctionItem 엔티티를 AuctionItemSummaryDto로 변환하는 헬퍼 메소드
    private AuctionItemSummaryDto convertToSummaryDto(AuctionItem item) {
        // AuctionItemService의 DTO 변환 로직과 일관성을 맞춥니다.
        int currentPrice = item.getFinalBidPrice() != 0 ? item.getFinalBidPrice() : item.getMinPrice();
        return new AuctionItemSummaryDto(
                item.getId(),
                item.getTitle(),
                item.getImageUrl(),
                currentPrice,
                item.getAuctionEnd(), // AuctionItem 엔티티의 마감 시간 필드명으로 맞춰주세요. (예: getAuctionDeadline())
                item.getStatus(),
                item.getFavoriteCount(),
                item.getSeller().getNickname(),
                item.getViewCount(),
                item.getBids() != null ? item.getBids().size() : 0
        );
    }
}