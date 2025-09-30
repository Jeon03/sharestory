package com.sharestory.sharestory_backend.api;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.domain.DealInfo;
import com.sharestory.sharestory_backend.dto.*;
import com.sharestory.sharestory_backend.fcm.FirebaseService;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import com.sharestory.sharestory_backend.service.AuctionItemSearchService;
import com.sharestory.sharestory_backend.service.AuctionItemService;
import com.sharestory.sharestory_backend.service.BidService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/auction-items")
@RequiredArgsConstructor
public class AuctionItemController {
    private final FirebaseService firebaseService; // FirebaseService 주입
    private final AuctionItemService auctionItemService;
    private final AuctionItemSearchService auctionItemSearchService;
    private final BidService bidService;
    // ItemController의 ObjectMapper를 가져옵니다.
    private final ObjectMapper objectMapper;

    /**
     * 경매 상품 등록 (ItemController 방식 적용)
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createAuctionItem(
            @AuthenticationPrincipal CustomUserDetails user,

            // 다중 이미지 처리를 위한 'images'
            @RequestPart(value = "images", required = false) List<MultipartFile> images,

            // 단일 이미지 처리를 위한 'image' (하위 호환성)
            @RequestPart(value = "image", required = false) MultipartFile singleImage,

            // 나머지 필드는 @RequestParam으로 받습니다.
            @RequestParam("title") String title,
            @RequestParam("category") String category,
            @RequestParam("condition") String condition,
            @RequestParam("minPrice") Integer minPrice,
            @RequestParam("auctionDuration") Long auctionDuration,
            @RequestParam("description") String description,
            @RequestParam("dealInfo") String dealInfoJson,
            @RequestParam("latitude") Double latitude,
            @RequestParam("longitude") Double longitude
    ) {
        try {
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증 정보가 없습니다.");
            }
            Long userId = user.getId();

            // 이미지 리스트 병합 (단수 -> 복수)
            if (images == null) images = new ArrayList<>();
            if (singleImage != null && !singleImage.isEmpty()) {
                images.add(singleImage);
            }

            // 이미지 유효성 검사
            if (images.isEmpty() || images.size() > 3) {
                return ResponseEntity.badRequest().body("이미지는 1장에서 3장까지 업로드해야 합니다.");
            }
            for (MultipartFile f : images) {
                if (f == null || f.isEmpty()) {
                    return ResponseEntity.badRequest().body("비어있는 이미지 파일이 포함되어 있습니다.");
                }
                String contentType = Optional.ofNullable(f.getContentType()).orElse("");
                if (!contentType.startsWith("image/")) {
                    return ResponseEntity.badRequest().body("이미지 파일 형식(jpg, png 등)만 업로드할 수 있습니다.");
                }
                if (f.getSize() > 10 * 1024 * 1024) { // 10MB 제한
                    return ResponseEntity.badRequest().body("이미지 파일 크기는 최대 10MB를 넘을 수 없습니다.");
                }
            }

            // dealInfo JSON 문자열을 객체로 변환
            DealInfo dealInfo = objectMapper.readValue(dealInfoJson, DealInfo.class);

            // DTO 객체를 컨트롤러 내부에서 생성
            AuctionItemCreateRequestDto createDto = AuctionItemCreateRequestDto.builder()
                    .title(title)
                    .category(category)
                    .condition(condition)
                    .minPrice(minPrice)
                    .auctionDuration(auctionDuration)
                    .description(description)
                    .dealInfo(dealInfo)
                    .latitude(latitude)
                    .longitude(longitude)
                    .build();

            AuctionItem saved = auctionItemService.registerAuctionItem(createDto, images, userId);

            Map<String, Object> body = new HashMap<>();
            body.put("id", saved.getId());
            body.put("imageUrls", auctionItemService.getImageUrls(saved.getId()));
            return ResponseEntity.ok(body);

        } catch (Exception e) {
            log.error("경매 상품 등록 중 예외 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("등록 실패: " + e.getMessage());
        }
    }


    /**
     * 경매 상품 수정 (ItemController 방식 적용)
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> updateAuctionItem(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestPart("data") AuctionItemRequestDto updateDto,
            @RequestPart(value = "images", required = false) List<MultipartFile> newImages,
            @RequestPart(value = "deletedImageIds", required = false) String deletedImageIdsJson
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증 정보가 없습니다.");
        }
        try {
            // 삭제할 이미지 ID 리스트를 JSON 문자열로부터 파싱
            List<Long> deletedImageIds = new ArrayList<>();
            if (deletedImageIdsJson != null && !deletedImageIdsJson.isBlank()) {
                deletedImageIds = objectMapper.readValue(
                        deletedImageIdsJson,
                        new TypeReference<List<Long>>() {}
                );
            }

            auctionItemService.updateAuctionItem(id, updateDto, newImages, deletedImageIds, user.getId());
            return ResponseEntity.ok("경매 상품이 수정되었습니다.");
        } catch (Exception e) {
            log.error("경매 상품 수정 중 예외 발생 (ID: {})", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("수정 실패: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteAuctionItem(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails user) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증 정보가 없습니다.");
        try {
            auctionItemService.deleteAuctionItem(id, user.getId());
            return ResponseEntity.ok("경매 상품이 삭제되었습니다.");
        } catch (Exception e) {
            log.error("경매 상품 삭제 중 예외 발생 (ID: {})", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("삭제 실패: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuctionItemDetailResponseDto> getAuctionItem(@PathVariable Long id) {
        AuctionItemDetailResponseDto itemDto = auctionItemService.findAuctionItemById(id);
        return ResponseEntity.ok(itemDto);
    }

    @GetMapping
    public ResponseEntity<Page<AuctionItemSummaryDto>> getAuctionItems(Pageable pageable) {
        Page<AuctionItemSummaryDto> items = auctionItemService.findAllAuctionItems(pageable);
        return ResponseEntity.ok(items);
    }

    @PostMapping("/{id}/bids")
    public ResponseEntity<?> placeBid(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody BidRequestDto bidDto) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증 정보가 없습니다.");
        try {
            BidService.BidResult result = bidService.placeBid(id, bidDto, user.getId());

            if (result.success) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            log.error("입찰 처리 중 오류 발생: itemId={}, userId={}", id, user.getId(), e);
            Map<String, String> errorBody = new HashMap<>();
            errorBody.put("message", "입찰 처리 중 서버 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorBody);
        }
    }

    @GetMapping("/{id}/bids")
    public ResponseEntity<List<BidHistoryDto>> getBidHistory(@PathVariable Long id) {
        List<BidHistoryDto> bidHistory = auctionItemService.getBidHistory(id);
        return ResponseEntity.ok(bidHistory);
    }



    @GetMapping("/active-images")
    public ResponseEntity<List<ActiveImageDto>> getActiveImages() {
        List<ActiveImageDto> activeImages = auctionItemService.findActiveImages();
        return ResponseEntity.ok(activeImages);
    }

    @GetMapping("/sorted/ending-soon")
    public ResponseEntity<Page<AuctionItemSummaryDto>> getEndingSoonAuctionItems(Pageable pageable) {
        Page<AuctionItemSummaryDto> items = auctionItemService.findEndingSoonItems(pageable);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/sorted/popular")
    public ResponseEntity<Page<AuctionItemSummaryDto>> getPopularAuctionItems(Pageable pageable) {
        Page<AuctionItemSummaryDto> items = auctionItemService.findPopularItems(pageable);
        return ResponseEntity.ok(items);
    }
        // --- [추가된 코드 시작] ---
        /**
         * 경매 상품 검색
         * @param keyword 검색어 (필수 아님)
         * @param pageable 페이징 정보
         * @return 검색 결과
         */
        @GetMapping("/search")
        public ResponseEntity<Page<AuctionItemSummaryDto>> searchAuctionItems(
                @RequestParam(required = false) String keyword,
                Pageable pageable) {
            // AuctionItemSearchService를 사용하여 키워드 기반 검색 수행
            Page<AuctionItemSummaryDto> results = auctionItemSearchService.searchAuctionItemsByKeyword(keyword, pageable);
            return ResponseEntity.ok(results);
        }
        // --- [추가된 코드 종료] ---

    @PostMapping("/notify-bid")
    public ResponseEntity<Void> sendBidNotification(@RequestBody BidNotificationRequestDto request) {
        // auctionItemService 등을 사용하여 itemId로 상품 정보를 가져옵니다.
        // 상품 판매자 ID, 이전 최고 입찰자 ID 등을 찾습니다.
        Long sellerId = auctionItemService.findSellerIdByItemId(request.getItemId());

        String title = "새로운 입찰이 등록되었습니다!";
        String body = String.format("%,d원에 새로운 입찰이 있습니다.", request.getBidAmount());

        // 판매자에게 알림 보내기
        firebaseService.sendPushNotificationToUser(sellerId, title, body);

        // (필요 시) 이전 최고 입찰자에게도 알림을 보낼 수 있습니다.

        return ResponseEntity.ok().build();
    }
}