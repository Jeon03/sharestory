package com.sharestory.sharestory_backend.api;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sharestory.sharestory_backend.domain.DealInfo;
import com.sharestory.sharestory_backend.domain.Item;
import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.dto.*;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import com.sharestory.sharestory_backend.service.ItemSearchService;
import com.sharestory.sharestory_backend.service.ItemService;
import com.sharestory.sharestory_backend.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;


@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;
    private final ObjectMapper objectMapper;
    private final ItemSearchService itemSearchService;
    private final OrderService orderService;

    @PostMapping(value = "/registerItem", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> registerItem(
            @AuthenticationPrincipal CustomUserDetails user,

            // 새 프론트: 여러 장
            @RequestPart(value = "images", required = false) List<MultipartFile> images,

            // 옛 프론트 하위호환: 단일 키
            @RequestPart(value = "image", required = false) MultipartFile singleImage,

            // 나머지 필드
            @RequestParam("title") String title,
            @RequestParam("category") String category,
            @RequestParam("condition") String condition,
            @RequestParam("price") Integer price,
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

            // 리스트 병합 (단수 -> 복수)
            if (images == null) images = new ArrayList<>();
            if (singleImage != null && !singleImage.isEmpty()) {
                images.add(singleImage);
            }

            // 1차 검증
            if (images.size() > 3) {
                return ResponseEntity.badRequest().body("이미지는 최대 3장까지 업로드할 수 있습니다.");
            }
            for (MultipartFile f : images) {
                if (f == null || f.isEmpty()) {
                    return ResponseEntity.badRequest().body("빈 이미지가 포함되어 있습니다.");
                }
                String ct = Optional.ofNullable(f.getContentType()).orElse("");
                if (!ct.startsWith("image/")) {
                    return ResponseEntity.badRequest().body("이미지 파일만 업로드할 수 있습니다.");
                }
                if (f.getSize() > 10 * 1024 * 1024) {
                    return ResponseEntity.badRequest().body("이미지 크기는 최대 10MB까지 허용됩니다.");
                }
            }

            // JSON → 객체
            DealInfo dealInfo = objectMapper.readValue(dealInfoJson, DealInfo.class);

            ItemRequestDto dto = ItemRequestDto.builder()
                    .title(title)
                    .category(category)
                    .condition(condition)
                    .price(price)
                    .description(description)
                    .latitude(latitude)
                    .longitude(longitude)
                    .dealInfo(dealInfo)
                    .build();

            Item saved = itemService.registerItem(dto, images, userId);

            Map<String, Object> body = new HashMap<>();
            body.put("id", saved.getId());
            body.put("imageUrls", itemService.getImageUrls(saved.getId()));
            return ResponseEntity.ok(body);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("등록 실패: " + e.getMessage());
        }

    }

    @PutMapping(value = "/items/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateItem(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestPart("data") ItemRequestDto dto,
            @RequestPart(value = "images", required = false) List<MultipartFile> newImages,
            @RequestPart(value = "deletedImageIds", required = false) String deletedImageIdsJson
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증 정보가 없습니다.");
        }

        try {
            List<Long> deletedImageIds = new ArrayList<>();
            if (deletedImageIdsJson != null && !deletedImageIdsJson.isBlank()) {
                ObjectMapper mapper = new ObjectMapper();
                deletedImageIds = mapper.readValue(
                        deletedImageIdsJson,
                        new TypeReference<List<Long>>() {}
                );
            }

            itemService.updateItem(id, dto, newImages, deletedImageIds, user.getId());
            return ResponseEntity.ok("상품이 수정되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("수정 실패: " + e.getMessage());
        }
    }

    // ✅ 상품 삭제
    @DeleteMapping("/items/{id}")
    public ResponseEntity<?> deleteItem(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        try {
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증 정보가 없습니다.");
            }
            itemService.deleteItem(id, user.getId());
            return ResponseEntity.ok("상품이 삭제되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("삭제 실패: " + e.getMessage());
        }
    }

    @GetMapping("/items/autocomplete")
    public ResponseEntity<List<ItemSummaryDto>> autocomplete(
            @RequestParam String keyword,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon,
            @RequestParam(defaultValue = "5km") String distance,
            @AuthenticationPrincipal CustomUserDetails user // ✅ 로그인 여부 확인
    ) throws IOException {
        if (user != null) {
            // ✅ 로그인 사용자 → 위치 포함 자동완성
            return ResponseEntity.ok(itemSearchService.autocomplete(keyword, lat, lon, distance));
        } else {
            // ✅ 비로그인 사용자 → 키워드만 자동완성 (위도/경도 무시)
            return ResponseEntity.ok(itemSearchService.autocomplete(keyword, null, null, null));
        }
    }


    @PatchMapping("/items/{id}/status")
    public ResponseEntity<String> updateItemStatus(
            @PathVariable Long id,
            @RequestParam ItemStatus status,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        itemService.updateStatus(id, status, user.getId());
        return ResponseEntity.ok("상품 상태가 변경되었습니다.");
    }

    // ✅ 해당 상품과 연결된 채팅방 목록 조회
    @GetMapping("/items/{id}/chatrooms")
    public ResponseEntity<?> getChatRooms(@PathVariable Long id,
                                          @AuthenticationPrincipal CustomUserDetails user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(itemService.getChatRoomsForItem(id, user.getId()));
    }

    // ✅ 예약 확정
    @PostMapping("/items/{id}/reserve")
    public ResponseEntity<?> reserveItem(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody ReserveRequest request
    ) {
        try {
            itemService.reserveItem(id, user.getId(), request.getBuyerId(), request.getRoomId());
            return ResponseEntity.ok("예약 완료");
        } catch (Exception e) {
            e.printStackTrace(); // 로그 자세히 출력
            return ResponseEntity.badRequest().body("예약 실패: " + e.getMessage());
        }
    }
    //판매 확정
    @PostMapping("/items/{id}/complete")
    public ResponseEntity<?> completeSale(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody ReserveRequest request  // ✅ 재사용 가능 (buyerId, roomId 포함)
    ) {
        try {
            itemService.completeSale(id, user.getId(), request.getBuyerId(), request.getRoomId());
            return ResponseEntity.ok("판매 완료");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("판매 완료 실패: " + e.getMessage());
        }
    }

    // 내 상품 조회 (마이페이지)
    @GetMapping("/mypage/items")
    public List<ItemSummaryDto> getMyItems(@AuthenticationPrincipal CustomUserDetails user) {
        if (user == null) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        return itemService.getMyItems(user.getId());
    }
    @GetMapping("/mypage/purchased")
    public List<ItemSummaryDto> getPurchasedItems(
            @AuthenticationPrincipal(expression = "id") Long userId
    ) {
        return itemService.getPurchasedItems(userId);
    }


    // 구매자가 참여중인 안전거래 아이템
    @GetMapping("/items/safe/buyer")
    public List<ItemSummaryDto> getSafeBuyerItems(@AuthenticationPrincipal CustomUserDetails user) {
        return itemService.getSafeTradeItemsForBuyer(user.getId());
    }

    // 판매자가 참여중인 안전거래 아이템
    @GetMapping("/items/safe/seller")
    public List<ItemSummaryDto> getSafeSellerItems(@AuthenticationPrincipal CustomUserDetails user) {
        return itemService.getSafeTradeItemsForSeller(user.getId());
    }

    @PatchMapping("/items/{itemId}/confirm-receipt")
    public ResponseEntity<?> confirmItemReceipt(
            @PathVariable Long itemId,
            @AuthenticationPrincipal(expression = "id") Long buyerId
    ) {
        orderService.confirmReceiveByItemId(itemId, buyerId);
        return ResponseEntity.ok("물품 수령이 확인되었습니다.");
    }

    @PatchMapping("/items/{itemId}/payout")
    public ResponseEntity<String> payoutToSeller(
            @PathVariable Long itemId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        orderService.payoutToSeller(itemId, user.getId());
        return ResponseEntity.ok("포인트가 판매자에게 지급되었습니다.");
    }

}
