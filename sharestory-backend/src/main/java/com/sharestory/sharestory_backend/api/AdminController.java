package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.repo.AuctionItemRepository;
import com.sharestory.sharestory_backend.service.AuctionSchedulerService; // 👈 AuctionSchedulerService import
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
    private final AuctionSchedulerService auctionSchedulerService; // 👈 스케줄러 서비스 주입

    /**
     * [테스트용] 지정된 경매 상품의 종료 시간을 강제로 '1분 전'으로 설정합니다.
     */
    @GetMapping("/test/expire-item/{id}")
    public ResponseEntity<String> makeAuctionItemExpire(@PathVariable Long id) {
        AuctionItem item = auctionItemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("상품을 찾을 수 없습니다: " + id));

        item.setAuctionEnd(LocalDateTime.now().minusMinutes(1));
        auctionItemRepository.save(item);

        String message = String.format(
                "✅ 성공: 상품 ID %d의 경매 종료 시간을 '%s'으로 변경했습니다.",
                id,
                item.getAuctionEnd()
        );
        return ResponseEntity.ok(message);
    }

    /**
     * ✅ [추가된 코드]
     * [테스트용] 경매 마감 스케줄러 로직을 즉시 실행합니다.
     * DB 시간을 수정할 필요 없이, 이 API를 호출하면 바로 스케줄러가 동작합니다.
     */
    @GetMapping("/test/run-scheduler")
    public ResponseEntity<String> runAuctionScheduler() {
        try {
            auctionSchedulerService.closeExpiredAuctions();
            return ResponseEntity.ok("✅ 경매 마감 스케줄러를 수동으로 실행했습니다.");
        } catch (Exception e) {
            // 혹시 모를 오류에 대비
            return ResponseEntity.internalServerError().body("❌ 스케줄러 실행 중 오류 발생: " + e.getMessage());
        }
    }
}

//http://localhost:8080/api/admin/test/expire-item/2