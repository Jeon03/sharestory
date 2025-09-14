package com.sharestory.sharestory_backend.api;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sharestory.sharestory_backend.domain.DealInfo;
import com.sharestory.sharestory_backend.domain.Item;
import com.sharestory.sharestory_backend.dto.ItemRequestDto;
import com.sharestory.sharestory_backend.dto.ItemSummaryDto;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import com.sharestory.sharestory_backend.service.ItemSearchService;
import com.sharestory.sharestory_backend.service.ItemService;
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

    // ✅ 상품 수정
    @PutMapping(value = "/items/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateItem(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestPart("data") ItemRequestDto dto,
            @RequestPart(value = "images", required = false) List<MultipartFile> newImages
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증 정보가 없습니다.");
        }

        try {
            itemService.updateItem(id, dto, newImages, user.getId());
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
            @RequestParam(defaultValue = "5km") String distance
    ) throws IOException {
        return ResponseEntity.ok(itemSearchService.autocomplete(keyword, lat, lon, distance));
    }



}
