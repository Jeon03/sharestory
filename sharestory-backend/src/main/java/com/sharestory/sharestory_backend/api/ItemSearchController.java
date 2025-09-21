package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.dto.ItemSummaryDto;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import com.sharestory.sharestory_backend.service.ItemSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;


@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemSearchController {

    private final ItemSearchService itemSearchService;

    @GetMapping("/search")
    public ResponseEntity<List<ItemSummaryDto>> searchItems(
            @RequestParam String keyword,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon,
            @RequestParam(defaultValue = "5km") String distance,
            Authentication authentication

    ) throws IOException {
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
            // ✅ 로그인 사용자 → 위치검색 포함
            return ResponseEntity.ok(itemSearchService.searchItems(keyword, lat, lon, distance));
        } else {
            // ✅ 비로그인 사용자 → 위치정보 무시 (lat/lon=null)
            return ResponseEntity.ok(itemSearchService.searchItemsByKeyword(keyword));
        }
    }
}