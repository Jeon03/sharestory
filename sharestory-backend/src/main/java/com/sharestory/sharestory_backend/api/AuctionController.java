package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.dto.AuctionItemResponseDto;
import com.sharestory.sharestory_backend.service.AuctionItemService;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auction")
@RequiredArgsConstructor
public class AuctionController {

    private final AuctionItemService auctionItemService;

    @GetMapping("/my-auctions")
    public ResponseEntity<List<AuctionItemResponseDto>> getMyParticipatedAuctions(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        List<AuctionItemResponseDto> list = auctionItemService.getMyParticipatedAuctions(user.getId());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/my-sellings")
    public ResponseEntity<List<AuctionItemResponseDto>> getMySellingAuctions(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        List<AuctionItemResponseDto> list = auctionItemService.getMySellingAuctions(user.getId());
        return ResponseEntity.ok(list);
    }
}
