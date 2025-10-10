package com.sharestory.sharestory_backend.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/auctions")
@RequiredArgsConstructor
public class AdminAuctionController {

    private final AdminAuctionService adminAuctionService;

    @DeleteMapping("/{auctionId}/force-delete")
    public ResponseEntity<?> forceDeleteAuction(@PathVariable Long auctionId) {
        try {
            adminAuctionService.deleteAuctionCompletely(auctionId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "경매 상품 및 관련 데이터가 모두 삭제되었습니다."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "삭제 처리 중 오류가 발생했습니다."
            ));
        }
    }
}
