package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.repo.AuctionItemRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AuctionItemRepository auctionItemRepository;

    /**
     * [테스트용] 지정된 경매 상품의 종료 시간을 강제로 '1분 전'으로 설정합니다.
     * ✅ [수정] POST에서 GET으로 변경하여 브라우저에서 직접 호출할 수 있도록 함
     * ✅ [수정] 당장의 테스트 편의를 위해 ADMIN 권한 체크를 잠시 제거합니다.
     * @param id 경매 상품 ID
     * @return 성공 또는 실패 메시지
     */
    @GetMapping("/test/expire-item/{id}") // 👈 @PostMapping에서 @GetMapping으로 변경
    public ResponseEntity<String> makeAuctionItemExpire(@PathVariable Long id) {
        AuctionItem item = auctionItemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("상품을 찾을 수 없습니다: " + id));

        // 경매 종료 시간을 현재 시간보다 1분 전으로 설정
        item.setAuctionEnd(LocalDateTime.now().minusMinutes(1));

        auctionItemRepository.save(item);

        String message = String.format(
                "✅ 성공: 상품 ID %d의 경매 종료 시간을 '%s'으로 변경했습니다. 1분 내에 스케줄러가 실행됩니다.",
                id,
                item.getAuctionEnd()
        );
        return ResponseEntity.ok(message);
    }
}