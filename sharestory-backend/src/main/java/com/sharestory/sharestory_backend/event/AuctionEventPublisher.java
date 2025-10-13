package com.sharestory.sharestory_backend.event;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuctionEventPublisher {

    private final ApplicationEventPublisher eventPublisher;

    /** ✅ 경매 종료 이벤트 발행 */
    public void publishAuctionEndedEvent(Long auctionItemId) {
        eventPublisher.publishEvent(new AuctionEndedEvent(auctionItemId));
    }
}
