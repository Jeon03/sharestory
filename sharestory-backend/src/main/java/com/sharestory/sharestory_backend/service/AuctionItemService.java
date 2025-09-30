package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.domain.AuctionItemImage;
import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.dto.*;
import com.sharestory.sharestory_backend.repo.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuctionItemService {

    private final AuctionItemRepository auctionItemRepository;
    private final AuctionItemImageRepository auctionItemImageRepository;
    private final UserRepository userRepository;
    private final FavoriteAuctionItemRepository favoriteAuctionItemRepository;
    private final S3Service s3Service;
    private final AuctionItemSearchIndexer auctionItemSearchIndexer;
    private final BidRepository bidRepository;

    /**
     * 경매 상품 등록 (ItemService 로직 적용)
     */
    @Transactional
    public AuctionItem registerAuctionItem(AuctionItemCreateRequestDto dto, List<MultipartFile> images, Long userId) throws IOException {
        // 0) 이미지 리스트 null 체크
        List<MultipartFile> safeImages = images == null ? Collections.emptyList() : images;
        if (safeImages.size() > 3) {
            throw new IllegalArgumentException("이미지는 최대 3장까지 업로드할 수 있습니다.");
        }

        User seller = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + userId));
        LocalDateTime auctionStart = LocalDateTime.now();
        LocalDateTime auctionEnd = auctionStart.plusDays(dto.getAuctionDuration());

        // 1) AuctionItem 먼저 저장 (ID를 S3 경로에 사용하기 위함)
        AuctionItem auctionItem = AuctionItem.builder()
                .title(dto.getTitle())
                .category(dto.getCategory())
                .status(ItemStatus.ON_AUCTION)
                .condition(dto.getCondition())
                .minPrice(dto.getMinPrice())
                .description(dto.getDescription())
                .dealInfo(dto.getDealInfo())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .seller(seller)
                .auctionStart(auctionStart)
                .auctionEnd(auctionEnd)
                .build();
        auctionItemRepository.saveAndFlush(auctionItem); // ID 생성을 보장

        // 2) S3에 이미지 업로드
        List<String> uploadedUrls = new ArrayList<>();
        try {
            for (MultipartFile file : safeImages) {
                if (file == null || file.isEmpty()) continue;
                String url = s3Service.uploadFile(file, "auction-items/" + auctionItem.getId());
                uploadedUrls.add(url);
            }
        } catch (Exception e) {
            // S3 업로드 실패 시 보상 트랜잭션 (이미 업로드된 파일 삭제)
            // 이 부분은 필요 시 S3Service에 추가 구현이 필요합니다.
            log.error("S3 이미지 업로드 실패. 롤백이 필요할 수 있습니다.", e);
            throw new IOException("S3 이미지 업로드에 실패했습니다.", e);
        }

        // 3) AuctionItemImage 엔티티 생성 및 DB 저장 (배치 처리)
        List<AuctionItemImage> imageEntities = IntStream.range(0, uploadedUrls.size())
                .mapToObj(i -> AuctionItemImage.builder()
                        .auctionItem(auctionItem)
                        .url(uploadedUrls.get(i))
                        .sortOrder(i)
                        .build())
                .collect(Collectors.toList());

        if (!imageEntities.isEmpty()) {
            auctionItemImageRepository.saveAll(imageEntities);
            auctionItem.getImages().addAll(imageEntities);
            // 대표 이미지 설정
            auctionItem.setImageUrl(uploadedUrls.get(0));
        }

        // 4) 검색 엔진에 인덱싱
        auctionItemSearchIndexer.indexItem(auctionItem);
        return auctionItem;
    }

    /**
     * 경매 상품 수정 (ItemService 로직 적용)
     */
    @Transactional
    public void updateAuctionItem(Long itemId, AuctionItemRequestDto dto, List<MultipartFile> newImages, List<Long> deletedImageIds, Long userId) throws IOException {
        AuctionItem auctionItem = auctionItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다."));

        if (!auctionItem.getSeller().getId().equals(userId)) {
            throw new SecurityException("수정 권한이 없습니다.");
        }

        // 상품 기본 정보 수정
        auctionItem.setTitle(dto.getTitle());
        auctionItem.setCategory(dto.getCategory());
        auctionItem.setCondition(dto.getCondition());
        auctionItem.setMinPrice(dto.getMinPrice());
        auctionItem.setDescription(dto.getDescription());
        auctionItem.setDealInfo(dto.getDealInfo());
        auctionItem.setLatitude(dto.getLatitude());
        auctionItem.setLongitude(dto.getLongitude());

        // 삭제할 이미지가 있다면 S3와 DB에서 모두 제거
        if (deletedImageIds != null && !deletedImageIds.isEmpty()) {
            List<AuctionItemImage> toDelete = auctionItemImageRepository.findAllById(deletedImageIds);
            for (AuctionItemImage img : toDelete) {
                try {
                    String key = s3Service.extractKeyFromUrl(img.getUrl());
                    if (key != null) s3Service.deleteByKey(key);
                } catch (Exception e) {
                    log.error("[S3 DELETE FAIL] URL: {}, Error: {}", img.getUrl(), e.getMessage());
                }
            }
            auctionItemImageRepository.deleteAll(toDelete);
            auctionItem.getImages().removeAll(toDelete);
        }

        // 새로 추가할 이미지가 있다면 S3에 업로드하고 DB에 저장
        if (newImages != null && !newImages.isEmpty()) {
            if (auctionItem.getImages().size() + newImages.size() > 3) {
                throw new IllegalArgumentException("이미지는 최대 3장까지 등록할 수 있습니다.");
            }
            List<AuctionItemImage> newImageEntities = new ArrayList<>();
            for (int i = 0; i < newImages.size(); i++) {
                MultipartFile file = newImages.get(i);
                if (file == null || file.isEmpty()) continue;

                String url = s3Service.uploadFile(file, "auction-items/" + itemId);
                AuctionItemImage newImg = AuctionItemImage.builder()
                        .auctionItem(auctionItem)
                        .url(url)
                        // 기존 이미지 개수 뒤에 순서를 붙임
                        .sortOrder(auctionItem.getImages().size() + i)
                        .build();
                newImageEntities.add(newImg);
            }
            auctionItemImageRepository.saveAll(newImageEntities);
            auctionItem.getImages().addAll(newImageEntities);
        }

        // 대표 이미지 갱신 (남아있는 이미지 중 첫 번째)
        if (!auctionItem.getImages().isEmpty()) {
            // 정렬 후 첫 번째 이미지로 설정
            auctionItem.getImages().sort(java.util.Comparator.comparing(AuctionItemImage::getSortOrder));
            auctionItem.setImageUrl(auctionItem.getImages().get(0).getUrl());
        } else {
            auctionItem.setImageUrl(null); // 이미지가 모두 삭제된 경우
        }

        auctionItemSearchIndexer.indexItem(auctionItem);
    }

    /**
     * 경매 상품 삭제 (ItemService 로직 적용)
     */
    @Transactional
    public void deleteAuctionItem(Long itemId, Long userId) {
        AuctionItem auctionItem = auctionItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다."));

        if (!auctionItem.getSeller().getId().equals(userId)) {
            throw new SecurityException("삭제 권한이 없습니다.");
        }

        // S3에서 이미지 파일들 삭제
        if (auctionItem.getImages() != null && !auctionItem.getImages().isEmpty()) {
            for (AuctionItemImage img : auctionItem.getImages()) {
                try {
                    String key = s3Service.extractKeyFromUrl(img.getUrl());
                    if (key != null) s3Service.deleteByKey(key);
                } catch (Exception e) {
                    log.error("[S3 DELETE FAIL] URL: {}, Error: {}", img.getUrl(), e.getMessage());
                }
            }
        }

        // 연관된 엔티티들 삭제 (입찰, 찜하기 등)
        favoriteAuctionItemRepository.deleteAllByAuctionItemId(itemId);
        bidRepository.deleteAll(auctionItem.getBids());

        // 이미지 DB 정보 삭제
        auctionItemImageRepository.deleteAll(auctionItem.getImages());

        // 상품 자체를 삭제
        auctionItemRepository.delete(auctionItem);

        // 검색 인덱스에서 제거
        auctionItemSearchIndexer.deleteItem(itemId);
    }


    // 이하 다른 메소드들은 그대로 유지됩니다.

    @Transactional(readOnly = true)
    public AuctionItem getItemDetail(Long id) {
        return auctionItemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("상품을 찾을 수 없습니다: " + id));
    }

    @Transactional(readOnly = true)
    public AuctionItemDetailResponseDto findAuctionItemById(Long id) {
        AuctionItem item = auctionItemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("상품을 찾을 수 없습니다: " + id));
        AuctionItemDetailResponseDto.UserDto sellerDto = null;
        if(item.getSeller() != null) {
            sellerDto = AuctionItemDetailResponseDto.UserDto.builder().id(item.getSeller().getId()).nickname(item.getSeller().getNickname()).build();
        }
        AuctionItemDetailResponseDto.UserDto highestBidderDto = null;
        if(item.getHighestBidder() != null) {
            highestBidderDto = AuctionItemDetailResponseDto.UserDto.builder().id(item.getHighestBidder().getId()).nickname(item.getHighestBidder().getNickname()).build();
        }
        // 2. 조회한 엔티티의 정보를 DTO 빌더에 매핑합니다.
        return AuctionItemDetailResponseDto.builder()
                .id(item.getId())
                .title(item.getTitle())
                .category(item.getCategory())
                .description(item.getDescription())
                .condition(item.getCondition())
                .dealInfo(item.getDealInfo()) // ✅ 이 부분에서 DealInfo 객체를 그대로 전달해야 합니다.
                .latitude(item.getLatitude())
                .longitude(item.getLongitude())
                .minPrice(item.getMinPrice())
                .finalBidPrice(item.getFinalBidPrice())
                .auctionStart(item.getAuctionStart())
                .auctionEnd(item.getAuctionEnd())
                .status(item.getStatus())
                .seller(sellerDto)
                .highestBidder(highestBidderDto)
                .imageUrls(getImageUrls(id))
                .viewCount(item.getViewCount())
                .createdDate(item.getCreatedAt())
                .updatedDate(item.getUpdatedAt())
                .dealInfo(item.getDealInfo())
                .build();
    }

    @Transactional(readOnly = true)
    public List<String> getImageUrls(Long itemId) {
        return auctionItemImageRepository.findByAuctionItemIdOrderBySortOrderAsc(itemId).stream()
                .map(AuctionItemImage::getUrl)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<AuctionItemSummaryDto> findAllAuctionItems(Pageable pageable) {
        return auctionItemRepository.findAll(pageable)
                .map(this::convertToSummaryDto);
    }

    @Transactional(readOnly = true)
    public List<BidHistoryDto> getBidHistory(Long id) {
        return bidRepository.findByAuctionItemIdOrderByBidTimeDesc(id).stream()
                .map(bid -> BidHistoryDto.builder()
                        .bidderNickname(bid.getBidder().getNickname())
                        .bidPrice(bid.getBidPrice())
                        .bidTime(bid.getBidTime())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ActiveImageDto> findActiveImages() {
        return auctionItemRepository.findByStatus(ItemStatus.ON_AUCTION).stream()
                .map(item -> ActiveImageDto.builder()
                        .id(item.getId())
                        .imageUrl(item.getImageUrl())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<AuctionItemSummaryDto> findEndingSoonItems(Pageable pageable) {
        // [♻️ 수정됨] findByStatusOrderByAuctionEndAsc -> findByStatusOrderByAuctionDeadlineAsc
        Page<AuctionItem> items = auctionItemRepository.findByStatusOrderByAuctionEndAsc(ItemStatus.ON_AUCTION, pageable);
        return items.map(this::convertToSummaryDto);
    }

    @Transactional(readOnly = true)
    public Page<AuctionItemSummaryDto> findPopularItems(Pageable pageable) {
        // [♻️ 수정됨] findByStatusOrderByBidCountDesc -> findPopularItemsByStatus
        Page<AuctionItem> items = auctionItemRepository.findPopularItemsByStatus(ItemStatus.ON_AUCTION, pageable);
        return items.map(this::convertToSummaryDto);
    }

    private AuctionItemSummaryDto convertToSummaryDto(AuctionItem item) {
        int currentPrice = item.getFinalBidPrice() != 0 ? item.getFinalBidPrice() : item.getMinPrice();
        return new AuctionItemSummaryDto(
                item.getId(),
                item.getTitle(),
                item.getImageUrl(),
                currentPrice,
                item.getAuctionEnd(),
                item.getStatus(),
                item.getFavoriteCount(),
                item.getSeller().getNickname(),
                item.getViewCount(),
                item.getBids() != null ? item.getBids().size() : 0
        );
    }
    @Transactional(readOnly = true)
    public Long findSellerIdByItemId(Long itemId) {
        // 1. Repository를 통해 상품 정보를 찾습니다.
        AuctionItem item = auctionItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다. ID: " + itemId));

        // 2. 찾은 상품 정보에서 판매자(seller) 객체를 가져온 후, 그 판매자의 ID를 반환합니다.
        return item.getSeller().getId();
    }
}