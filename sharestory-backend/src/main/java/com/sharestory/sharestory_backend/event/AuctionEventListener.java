package com.sharestory.sharestory_backend.event;

import com.sharestory.sharestory_backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuctionEventListener {

    private final ChatService chatService;

    /** ✅ 경매 종료 후 트랜잭션 커밋 이후 실행 */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleAuctionEnded(AuctionEndedEvent event) {
        try {
            chatService.sendSystemMessageForAuction(
                    event.getAuctionItemId(),
                    "🎉 경매가 종료되었습니다!\n" +
                            "낙찰을 축하드립니다 🎉\n" +
                            "💳 안전거래를 진행하기 위해 결제 및 배송정보를 등록해주세요."
            );
            log.info("📨 [Event] 시스템 메시지 및 FCM 전송 완료 → auctionId={}", event.getAuctionItemId());
        } catch (Exception e) {
            log.error("❌ [Event] 시스템 메시지/Fcm 전송 실패 → auctionId={}, error={}",
                    event.getAuctionItemId(), e.getMessage());
        }
    }
}
