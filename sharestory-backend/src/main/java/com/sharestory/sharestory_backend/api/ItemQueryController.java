// src/main/java/com/sharestory/sharestory_backend/api/ItemQueryController.java
package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.dto.ItemDetailResponse;
import com.sharestory.sharestory_backend.dto.ItemSummaryDto;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import com.sharestory.sharestory_backend.service.ItemQueryService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ItemQueryController {

    private final ItemQueryService itemQueryService;

    // 최신 등록 상품
    // GET /api/items/sorted/latest?size=60
    @GetMapping("/items/sorted/latest")
    public List<ItemSummaryDto> latest(@RequestParam(defaultValue = "60") int size) {
        return itemQueryService.getLatest(size);
    }

    // 관심이 많은 상품
    // GET /api/items/sorted/favorites?size=60
    @GetMapping("/items/sorted/favorites")
    public List<ItemSummaryDto> favorites(@RequestParam(defaultValue = "60") int size) {
        return itemQueryService.getFavorites(size);
    }

    // 많이 본 상품
    // GET /api/items/sorted/views?size=60
    @GetMapping("/items/sorted/views")
    public List<ItemSummaryDto> views(@RequestParam(defaultValue = "60") int size) {
        return itemQueryService.getViews(size);
    }

    // 전체 상품 (페이지네이션)
    // GET /api/allItems?page=0&size=120
    @GetMapping("/allItems")
    public List<ItemSummaryDto> all(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "120") int size
    ) {
        return itemQueryService.getAll(page, size);
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<ItemDetailResponse> getItem(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails user,
            HttpServletRequest request
    ) {
        Long userId = (user != null) ? user.getId() : 0L;
        String ipAddress = getClientIp(request);

        // 1. 조회수 증가
        itemQueryService.increaseViewCount(id, userId, ipAddress);

        // 2. 상세 조회
        return ResponseEntity.ok(itemQueryService.getDetail(id));
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) {
            ip = request.getRemoteAddr();
        } else {
            ip = ip.split(",")[0].trim(); // 프록시 체인 첫 번째 값 사용
        }
        return ip;
    }
}
