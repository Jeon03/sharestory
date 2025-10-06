package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.domain.AuctionItemImage;
import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.dto.*;
import com.sharestory.sharestory_backend.fcm.FCMUtil; // ✅ 알림 기능 import 추가
import com.sharestory.sharestory_backend.fcm.FcmTokenRepository; // ✅ 알림 기능 import 추가
import com.sharestory.sharestory_backend.fcm.SseService; // ✅ 알림 기능 import 추가
import com.sharestory.sharestory_backend.repo.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap; // ✅ 알림 기능 import 추가
import java.util.List;
import java.util.Map; // ✅ 알림 기능 import 추가
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

    // ✅ [추가된 의존성] 알림 전송을 위해 3개의 클래스를 주입받습니다.
    private final FcmTokenRepository fcmTokenRepository;
    private final SseService sseService;
    private final FCMUtil fcmUtil;

    @Value("${app.auction.default-reserve-price-multiplier:1.5}")
    private double defaultReservePriceMultiplier;

    /**
     * 경매 상품 등록
     */
    @Transactional
    public AuctionItem registerAuctionItem(AuctionItemCreateRequestDto dto, List<MultipartFile> images, Long userId) throws IOException {
        // ... (기존 registerAuctionItem 메소드 코드는 변경 없음)
        List<MultipartFile> safeImages = images == null ? Collections.emptyList() : images;
        if (safeImages.size() > 3) {
            throw new IllegalArgumentException("이미지는 최대 3장까지 업로드할 수 있습니다.");
        }

        User seller = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + userId));
        LocalDateTime auctionStart = LocalDateTime.now();
        LocalDateTime auctionEnd = auctionStart.plusDays(dto.getAuctionDuration());

        Integer reservePrice = dto.getReservePrice();
        if (reservePrice == null || reservePrice == 0) {
            reservePrice = (int) (dto.getMinPrice() * defaultReservePriceMultiplier);
        }

        AuctionItem auctionItem = AuctionItem.builder()
                .title(dto.getTitle())
                .category(dto.getCategory())
                .status(ItemStatus.ON_AUCTION)
                .condition(dto.getCondition())
                .minPrice(dto.getMinPrice())
                .reservePrice(reservePrice)
                .buyNowPrice(dto.getBuyNowPrice())
                .description(dto.getDescription())
                .dealInfo(dto.getDealInfo())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .seller(seller)
                .auctionStart(auctionStart)
                .auctionEnd(auctionEnd)
                .build();
        auctionItemRepository.saveAndFlush(auctionItem);

        List<String> uploadedUrls = new ArrayList<>();
        try {
            for (MultipartFile file : safeImages) {
                if (file == null || file.isEmpty()) continue;
                String url = s3Service.uploadFile(file, "auction-items/" + auctionItem.getId());
                uploadedUrls.add(url);
            }
        } catch (Exception e) {
            log.error("S3 이미지 업로드 실패. 롤백이 필요할 수 있습니다.", e);
            throw new IOException("S3 이미지 업로드에 실패했습니다.", e);
        }

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
            auctionItem.setImageUrl(uploadedUrls.get(0));
        }

        auctionItemSearchIndexer.indexItem(auctionItem);
        return auctionItem;
    }

    /**
     * 경매 상품 수정
     */
    @Transactional
    public void updateAuctionItem(Long itemId, AuctionItemRequestDto dto, List<MultipartFile> newImages, List<Long> deletedImageIds, Long userId) throws IOException {
        // ... (기존 updateAuctionItem 메소드 코드는 변경 없음)
        AuctionItem auctionItem = auctionItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다."));

        if (!auctionItem.getSeller().getId().equals(userId)) {
            throw new SecurityException("수정 권한이 없습니다.");
        }

        if (auctionItem.getBidCount() > 0) {
            if (dto.getMinPrice() != auctionItem.getMinPrice() ||
                    !dto.getReservePrice().equals(auctionItem.getReservePrice()) ||
                    !dto.getBuyNowPrice().equals(auctionItem.getBuyNowPrice())) {
                throw new IllegalStateException("입찰이 시작된 후에는 가격 관련 정보를 수정할 수 없습니다.");
            }
        }

        auctionItem.setTitle(dto.getTitle());
        auctionItem.setCategory(dto.getCategory());
        auctionItem.setCondition(dto.getCondition());
        auctionItem.setMinPrice(dto.getMinPrice());
        auctionItem.setReservePrice(dto.getReservePrice());
        auctionItem.setBuyNowPrice(dto.getBuyNowPrice());
        auctionItem.setDescription(dto.getDescription());
        auctionItem.setDealInfo(dto.getDealInfo());
        auctionItem.setLatitude(dto.getLatitude());
        auctionItem.setLongitude(dto.getLongitude());

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
                        .sortOrder(auctionItem.getImages().size() + i)
                        .build();
                newImageEntities.add(newImg);
            }
            auctionItemImageRepository.saveAll(newImageEntities);
            auctionItem.getImages().addAll(newImageEntities);
        }

        if (!auctionItem.getImages().isEmpty()) {
            auctionItem.getImages().sort(java.util.Comparator.comparing(AuctionItemImage::getSortOrder));
            auctionItem.setImageUrl(auctionItem.getImages().get(0).getUrl());
        } else {
            auctionItem.setImageUrl(null);
        }

        auctionItemSearchIndexer.indexItem(auctionItem);
    }

    /**
     * 경매 상품 삭제
     */
    @Transactional
    public void deleteAuctionItem(Long itemId, Long userId) {
        // ... (기존 deleteAuctionItem 메소드 코드는 변경 없음)
        AuctionItem auctionItem = auctionItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다."));

        if (!auctionItem.getSeller().getId().equals(userId)) {
            throw new SecurityException("삭제 권한이 없습니다.");
        }

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

        favoriteAuctionItemRepository.deleteAllByAuctionItemId(itemId);
        bidRepository.deleteAll(auctionItem.getBids());
        auctionItemImageRepository.deleteAll(auctionItem.getImages());
        auctionItemRepository.delete(auctionItem);
        auctionItemSearchIndexer.deleteItem(itemId);
    }

    /**
     * 즉시 구매 처리
     */
    @Transactional
    public void buyNow(Long itemId, Long buyerId) {
        AuctionItem item = auctionItemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("상품을 찾을 수 없습니다: " + itemId));

        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new EntityNotFoundException("구매자 정보를 찾을 수 없습니다: " + buyerId));

        if (item.getBuyNowPrice() == null) {
            throw new IllegalStateException("이 상품은 즉시 구매가 불가능합니다.");
        }
        if (!item.isBuyNowAvailable()) {
            throw new IllegalStateException("입찰이 시작되어 즉시 구매할 수 없습니다.");
        }
        if (!item.getStatus().equals(ItemStatus.ON_AUCTION)) {
            throw new IllegalStateException("현재 경매중인 상품이 아닙니다.");
        }
        if (item.getSeller().getId().equals(buyerId)) {
            throw new IllegalStateException("자신의 상품을 구매할 수 없습니다.");
        }
        if (buyer.getPoints() < item.getBuyNowPrice()) {
            throw new IllegalStateException("포인트가 부족하여 구매할 수 없습니다.");
        }

        item.setStatus(ItemStatus.SOLD_OUT);
        item.setBuyer(buyer);
        item.setFinalBidPrice(item.getBuyNowPrice());
        item.setAuctionEnd(LocalDateTime.now());
        item.setBuyNowAvailable(false);

        buyer.setPoints(buyer.getPoints() - item.getBuyNowPrice());

        auctionItemRepository.save(item);
        userRepository.save(buyer);

        auctionItemSearchIndexer.indexItem(item);

        log.info("즉시 구매 성공: itemId={}, buyerId={}", itemId, buyerId);

        // ✅ [추가된 코드] 즉시 구매 성공 후 판매자에게 알림을 보냅니다.
        String notificationTitle = "상품 즉시 구매 발생";
        String notificationBody = String.format("'%s'님이 '%s' 상품을 즉시 구매했습니다.", buyer.getNickname(), item.getTitle());
        notifyUser(item.getSeller(), notificationTitle, notificationBody);
    }


    @Transactional(readOnly = true)
    public AuctionItem getItemDetail(Long id) {
        // ... (기존 getItemDetail 메소드 코드는 변경 없음)
        return auctionItemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("상품을 찾을 수 없습니다: " + id));
    }

    @Transactional(readOnly = true)
    public AuctionItemDetailResponseDto findAuctionItemById(Long id) {
        // ... (기존 findAuctionItemById 메소드 코드는 변경 없음, 이전 단계에서 수정 완료)
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
        return AuctionItemDetailResponseDto.builder()
                .id(item.getId())
                .title(item.getTitle())
                .category(item.getCategory())
                .description(item.getDescription())
                .condition(item.getCondition())
                .dealInfo(item.getDealInfo())
                .latitude(item.getLatitude())
                .longitude(item.getLongitude())
                .minPrice(item.getMinPrice())
                .finalBidPrice(item.getFinalBidPrice())
                .buyNowPrice(item.getBuyNowPrice())
                .auctionStart(item.getAuctionStart())
                .auctionEnd(item.getAuctionEnd())
                .status(item.getStatus())
                .seller(sellerDto)
                .highestBidder(highestBidderDto)
                .imageUrls(getImageUrls(id))
                .viewCount(item.getViewCount())
                .createdDate(item.getCreatedAt())
                .updatedDate(item.getUpdatedAt())
                .buyNowAvailable(item.isBuyNowAvailable())
                .dealInfo(item.getDealInfo())
                .build();
    }

    // ... (getImageUrls, findAllAuctionItems 등 다른 메소드들은 변경 없음)

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
        Page<AuctionItem> items = auctionItemRepository.findByStatusOrderByAuctionEndAsc(ItemStatus.ON_AUCTION, pageable);
        return items.map(this::convertToSummaryDto);
    }

    @Transactional(readOnly = true)
    public Page<AuctionItemSummaryDto> findPopularItems(Pageable pageable) {
        Page<AuctionItem> items = auctionItemRepository.findPopularItemsByStatus(ItemStatus.ON_AUCTION, pageable);
        return items.map(this::convertToSummaryDto);
    }

    private AuctionItemSummaryDto convertToSummaryDto(AuctionItem item) {
        int currentPrice = item.getFinalBidPrice() > 0 ? item.getFinalBidPrice() : item.getMinPrice();
        return AuctionItemSummaryDto.builder()
                .id(item.getId())
                .title(item.getTitle())
                .imageUrl(item.getImageUrl())
                .currentPrice(currentPrice)
                .buyNowPrice(item.getBuyNowPrice())
                .auctionEnd(item.getAuctionEnd())
                .status(item.getStatus())
                .favoriteCount(item.getFavoriteCount())
                .sellerNickname(item.getSeller().getNickname())
                .viewCount(item.getViewCount())
                .bidCount(item.getBidCount())
                .build();
    }

    @Transactional(readOnly = true)
    public Long findSellerIdByItemId(Long itemId) {
        AuctionItem item = auctionItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다. ID: " + itemId));
        return item.getSeller().getId();
    }

    // ✅ [추가된 메소드] BidService에 있던 알림 전송 헬퍼 메소드를 가져옵니다.
    /**
     * 지정된 사용자에게 SSE와 FCM 알림을 모두 보내는 헬퍼 메서드입니다.
     */
    private void notifyUser(User user, String title, String body) {
        if (user == null) {
            log.warn("알림을 보낼 사용자(user)가 null입니다.");
            return;
        }

        Long userId = user.getId();
        log.info("알림 전송 시도: userId={}, title={}", userId, title);

        // SSE 알림 (현재 접속 중인 사용자 대상)
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("message", body);
        sseService.sendNotification(userId, "new-activity", eventData);

        // FCM 푸시 알림 (앱/웹을 사용하지 않는 사용자 대상)
        fcmTokenRepository.findFirstByUserId(userId).ifPresent(fcmToken -> {
            fcmUtil.send(fcmToken.getToken(), title, body);
        });
    }
}