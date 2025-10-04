package com.sharestory.sharestory_backend.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/items")
@RequiredArgsConstructor
public class AdminItemController {

    private final AdminItemService adminItemService;

    @DeleteMapping("/{itemId}/force-delete")
    public ResponseEntity<?> forceDeleteItem(@PathVariable Long itemId) {
        try {
            adminItemService.deleteItemCompletely(itemId);
            return ResponseEntity.ok(Map.of("success", true, "message", "상품 및 관련 리소스가 삭제되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}

