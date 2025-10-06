package com.sharestory.sharestory_backend.api;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.dto.*;
import com.sharestory.sharestory_backend.fcm.FirebaseService;
import com.sharestory.sharestory_backend.security.CustomUserDetails; // 👈 올바른 경로로 수정
import com.sharestory.sharestory_backend.service.AuctionItemSearchService;
import com.sharestory.sharestory_backend.service.AuctionItemService;
import com.sharestory.sharestory_backend.service.BidService;
import jakarta.persistence.EntityNotFoundException;
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/auction-items")
@RequiredArgsConstructor
public class AuctionItemController {
    private final FirebaseService firebaseService;
    private final AuctionItemService auctionItemService;
    private final AuctionItemSearchService auctionItemSearchService;
    private final BidService bidService;
    private final ObjectMapper objectMapper;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createAuctionItem(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @RequestPart("data") AuctionItemCreateRequestDto createDto
    ) {
        try {
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증 정보가 없습니다.");
            }
            Long userId = user.getId(); // 👈 user.getId()로 수정

            if (images == null || images.isEmpty() || images.size() > 3) {
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
            List<Long> deletedImageIds = new ArrayList<>();
            if (deletedImageIdsJson != null && !deletedImageIdsJson.isBlank()) {
                deletedImageIds = objectMapper.readValue(
                        deletedImageIdsJson,
                        new TypeReference<List<Long>>() {}
                );
            }

            auctionItemService.updateAuctionItem(id, updateDto, newImages, deletedImageIds, user.getId()); // 👈 user.getId()로 수정
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
            auctionItemService.deleteAuctionItem(id, user.getId()); // 👈 user.getId()로 수정
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

    @PostMapping("/{id}/buy-now")
    public ResponseEntity<String> buyNow(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }
        try {
            auctionItemService.buyNow(id, user.getId()); // 👈 user.getId()로 수정
            return ResponseEntity.ok("상품을 성공적으로 구매했습니다.");
        } catch (IllegalStateException | EntityNotFoundException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("즉시 구매 처리 중 예외 발생: itemId={}, userId={}", id, user.getId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("구매 처리 중 오류가 발생했습니다.");
        }
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
            BidService.BidResult result = bidService.placeBid(id, bidDto, user.getId()); // 👈 user.getId()로 수정

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

    @GetMapping("/search")
    public ResponseEntity<Page<AuctionItemSummaryDto>> searchAuctionItems(
            @RequestParam(required = false) String keyword,
            Pageable pageable) {
        Page<AuctionItemSummaryDto> results = auctionItemSearchService.searchAuctionItemsByKeyword(keyword, pageable);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/notify-bid")
    public ResponseEntity<Void> sendBidNotification(@RequestBody BidNotificationRequestDto request) {
        Long sellerId = auctionItemService.findSellerIdByItemId(request.getItemId());
        String title = "새로운 입찰이 등록되었습니다!";
        String body = String.format("%,d원에 새로운 입찰이 있습니다.", request.getBidAmount());
        firebaseService.sendPushNotificationToUser(sellerId, title, body);
        return ResponseEntity.ok().build();
    }
}