package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.dto.AuctionItemDto;
import com.sharestory.sharestory_backend.dto.AuctionItemResponseDto;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import com.sharestory.sharestory_backend.service.AuctionItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/auctions")
@RequiredArgsConstructor
public class AuctionItemController {

    private final AuctionItemService auctionItemService;

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> registerAuctionItem(
            @AuthenticationPrincipal CustomUserDetails user,

            // 이미지
            @RequestPart(value = "images", required = false) List<MultipartFile> images,

            // 나머지 폼 데이터
            @RequestParam("title") String title,
            @RequestParam("category") String category,
            @RequestParam("condition") String condition,
            @RequestParam("description") String description,
            @RequestParam("startPrice") Integer startPrice,
            @RequestParam("bidUnit") Integer bidUnit,
            @RequestParam("endDateTime") String endDateTime,
            @RequestParam("isImmediatePurchase") String isImmediatePurchase,
            @RequestParam(value = "immediatePrice", required = false) Integer immediatePrice
    ) {
        try {
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
            }

            Long userId = user.getId();

            if (images == null) images = new ArrayList<>();

            // 이미지 유효성 검사
            if (images.size() > 3)
                return ResponseEntity.badRequest().body("이미지는 최대 3장까지 업로드할 수 있습니다.");

            for (MultipartFile f : images) {
                if (f == null || f.isEmpty())
                    return ResponseEntity.badRequest().body("빈 이미지가 포함되어 있습니다.");

                String ct = Optional.ofNullable(f.getContentType()).orElse("");
                if (!ct.startsWith("image/"))
                    return ResponseEntity.badRequest().body("이미지 파일만 업로드할 수 있습니다.");
            }

            // 즉시구매 여부 변환
            boolean immediateAvailable = "yes".equalsIgnoreCase(isImmediatePurchase);

            // 서비스 호출
            AuctionItem saved = auctionItemService.registerAuctionItem(
                    title, category, condition, description,
                    startPrice, bidUnit, immediatePrice, immediateAvailable,
                    endDateTime, images, userId
            );

            Map<String, Object> body = new HashMap<>();
            body.put("id", saved.getId());
            body.put("imageUrls", auctionItemService.getImageUrls(saved.getId()));
            return ResponseEntity.ok(body);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("등록 실패: " + e.getMessage());
        }
    }

    @GetMapping("/list")
    public ResponseEntity<List<AuctionItemDto>> getAllAuctions() {
        List<AuctionItemDto> dtoList = auctionItemService.getAllAuctions();
        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuctionItemDto> getAuctionDetail(@PathVariable Long id) {
        AuctionItemDto dto = auctionItemService.getAuctionDetail(id);
        return ResponseEntity.ok(dto);
    }
}





