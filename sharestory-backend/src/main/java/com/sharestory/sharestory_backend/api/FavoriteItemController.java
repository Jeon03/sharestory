package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.security.CustomUserDetails;
import com.sharestory.sharestory_backend.service.FavoriteItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/favorites")
public class FavoriteItemController {
    private final FavoriteItemService favoriteService;

    @PostMapping("/{itemId}/toggle")
    public ResponseEntity<Map<String, Object>> toggleFavorite(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long itemId) {

        int favoriteCount = favoriteService.toggleFavorite(user.getId(), itemId);
        boolean isFavorite = favoriteService.isFavorite(user.getId(), itemId);

        return ResponseEntity.ok(Map.of(
                "isFavorite", isFavorite,
                "favoriteCount", favoriteCount
        ));
    }

    @GetMapping("/{itemId}")
    public ResponseEntity<Map<String, Object>> checkFavorite(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long itemId) {


        boolean isFavorite = false;
        if (user != null) {
            isFavorite = favoriteService.isFavorite(user.getId(), itemId);
        }
        int favoriteCount = favoriteService.getFavoriteCount(itemId);

        return ResponseEntity.ok(Map.of(
                "isFavorite", isFavorite,
                "favoriteCount", favoriteCount
        ));
    }
}