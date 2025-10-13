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
public class SafeOrderListener {

    private final ChatService chatService;

    // ✅ 트랜잭션 커밋 후 실행 (AFTER_COMMIT)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSafeOrderCreated(SafeOrderCreatedEvent event) {
        Long itemId = event.getItemId();
        log.info("💬 [AFTER_COMMIT] 안전거래 결제 완료 메시지 발송 → itemId={}", itemId);

        chatService.sendSystemMessage(
                itemId,
                "💳 구매자가 안전거래 결제를 완료했습니다. 송장을 등록해주세요."
        );
    }
}
