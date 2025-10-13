package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.domain.AuctionBid;
import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.dto.AuctionItemResponseDto;
import com.sharestory.sharestory_backend.repo.AuctionBidRepository;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import com.sharestory.sharestory_backend.service.AuctionBidService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auctions")
@RequiredArgsConstructor
public class AuctionBidController {

    private final AuctionBidRepository bidRepository;
    private final AuctionBidService auctionBidService;

    @GetMapping("/{auctionId}/bids")
    public List<AuctionBid> getBidsByAuction(@PathVariable Long auctionId) {
        return bidRepository.findByAuctionItemIdOrderByBidPriceDesc(auctionId);
    }

    @PostMapping("/{auctionId}/bid")
    public ResponseEntity<?> placeBid(
            @PathVariable Long auctionId,
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody Map<String, Integer> body
    ) {
        int bidPrice = body.get("price");

        try {
            AuctionItem updated = auctionBidService.placeBid(auctionId, user.getId(), bidPrice);
            return ResponseEntity.ok(AuctionItemResponseDto.from(updated, user.getId()));

        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace(); // 디버깅용
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{auctionId}/buy")
    public ResponseEntity<?> buyNow(
            @PathVariable Long auctionId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        try {
            AuctionItem updated = auctionBidService.buyNow(auctionId, user.getId());
            return ResponseEntity.ok(AuctionItemResponseDto.from(updated, user.getId()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
