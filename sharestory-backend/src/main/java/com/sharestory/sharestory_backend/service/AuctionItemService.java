package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.AuctionImage;
import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.dto.AuctionItemDto;
import com.sharestory.sharestory_backend.repo.AuctionImageRepository;
import com.sharestory.sharestory_backend.repo.AuctionItemRepository;
import com.sharestory.sharestory_backend.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Transactional
public class AuctionItemService {

    private final AuctionItemRepository auctionItemRepository;
    private final AuctionImageRepository auctionImageRepository;
    private final S3Service s3Service;
    private final UserRepository userRepository;


    public AuctionItem registerAuctionItem(
            String title,
            String category,
            String condition,
            String description,
            Integer startPrice,
            Integer bidUnit,
            Integer immediatePrice,
            boolean immediateAvailable,
            String endDateTime,
            List<MultipartFile> images,
            Long userId
    ) throws IOException {

        List<MultipartFile> safeImages = images == null ? Collections.emptyList() : images;
        if (safeImages.size() > 3)
            throw new IllegalArgumentException("이미지는 최대 3장까지 업로드할 수 있습니다.");

        // 1️⃣ 경매 아이템 저장
        AuctionItem item = AuctionItem.builder()
                .title(title)
                .category(category)
                .conditionType(condition)
                .description(description)
                .startPrice(startPrice)
                .currentPrice(startPrice)
                .bidUnit(bidUnit)
                .immediatePrice(immediatePrice)
                .immediateAvailable(immediateAvailable)
                .endDateTime(LocalDateTime.parse(endDateTime))
                .sellerId(userId)
                .viewCount(0)
                .bidCount(0)
                .createdAt(LocalDateTime.now())
                .build();

        auctionItemRepository.saveAndFlush(item); // ID 확보

        // 2️⃣ S3 업로드
        List<String> uploadedUrls = new ArrayList<>();
        try {
            for (MultipartFile file : safeImages) {
                if (file == null || file.isEmpty()) continue;
                String url = s3Service.uploadFile(file, "auction-items/" + item.getId());
                uploadedUrls.add(url);
            }
        } catch (Exception e) {
            for (String url : uploadedUrls) {
                s3Service.deleteFile(url);
            }
            throw e;
        }

        // 3️⃣ 이미지 엔티티 저장
        List<AuctionImage> imageEntities = IntStream.range(0, uploadedUrls.size())
                .mapToObj(i -> AuctionImage.builder()
                        .auctionItem(item)
                        .url(uploadedUrls.get(i))
                        .sortOrder(i)
                        .build())
                .toList();

        if (!imageEntities.isEmpty()) {
            auctionImageRepository.saveAll(imageEntities);
            item.getImages().addAll(imageEntities);
            item.setMainImageUrl(uploadedUrls.get(0));
        }

        return item;
    }

    /** ✅ 전체 경매상품 조회 (리스트) */
    @Transactional(readOnly = true)
    public List<AuctionItemDto> getAllAuctions() {
        List<AuctionItem> items = auctionItemRepository.findAll();
        return items.stream()
                .map(item -> {
                    String sellerNickname = userRepository.findById(item.getSellerId())
                            .map(User::getNickname)
                            .orElse("탈퇴한 사용자");

                    return AuctionItemDto.builder()
                            .id(item.getId())
                            .sellerId(item.getSellerId())
                            .sellerNickname(sellerNickname)
                            .buyerId(item.getBuyerId())
                            .title(item.getTitle())
                            .description(item.getDescription())
                            .category(item.getCategory())
                            .conditionType(item.getConditionType())
                            .startPrice(item.getStartPrice())
                            .currentPrice(item.getCurrentPrice())
                            .bidUnit(item.getBidUnit())
                            .immediatePrice(item.getImmediatePrice())
                            .immediateAvailable(item.isImmediateAvailable())
                            .endDateTime(item.getEndDateTime())
                            .createdAt(item.getCreatedAt())
                            .mainImageUrl(item.getMainImageUrl())
                            .imageUrls(item.getImages().stream().map(AuctionImage::getUrl).toList())
                            .status(item.getStatus() != null ? item.getStatus().name() : "ONGOING")
                            .build();
                })
                .toList();
    }

    /** ✅ 단일 경매상품 상세 조회 */
    @Transactional(readOnly = true)
    public AuctionItemDto getAuctionDetail(Long id) {
        AuctionItem item = auctionItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("경매 상품을 찾을 수 없습니다."));

        String sellerNickname = userRepository.findById(item.getSellerId())
                .map(User::getNickname)
                .orElse("탈퇴한 사용자");

        return AuctionItemDto.builder()
                .id(item.getId())
                .sellerId(item.getSellerId())
                .sellerNickname(sellerNickname)
                .buyerId(item.getBuyerId())
                .title(item.getTitle())
                .description(item.getDescription())
                .category(item.getCategory())
                .conditionType(item.getConditionType())
                .startPrice(item.getStartPrice())
                .currentPrice(item.getCurrentPrice())
                .bidUnit(item.getBidUnit())
                .immediatePrice(item.getImmediatePrice())
                .immediateAvailable(item.isImmediateAvailable())
                .endDateTime(item.getEndDateTime())
                .createdAt(item.getCreatedAt())
                .mainImageUrl(item.getMainImageUrl())
                .imageUrls(item.getImages().stream().map(AuctionImage::getUrl).toList())
                .status(item.getStatus() != null ? item.getStatus().name() : "ONGOING")
                .build();
    }

    /** ✅ 특정 상품의 이미지 URL 목록 반환 */
    @Transactional(readOnly = true)
    public List<String> getImageUrls(Long itemId) {
        return auctionImageRepository.findAllByAuctionItem_Id(itemId)
                .stream()
                .map(AuctionImage::getUrl)
                .toList();
    }
}
