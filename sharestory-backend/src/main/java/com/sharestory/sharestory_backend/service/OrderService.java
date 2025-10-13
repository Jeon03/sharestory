package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.*;
import com.sharestory.sharestory_backend.dto.*;
import com.sharestory.sharestory_backend.event.SafeOrderCreatedEvent;
import com.sharestory.sharestory_backend.repo.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final PointHistoryRepository pointHistoryRepository;
    private final AuctionItemRepository auctionItemRepository;
    private final NotificationTemplateService notificationTemplateService;
    private final ChatService chatService;
    private final ApplicationEventPublisher eventPublisher;
    /* ✅ 일반 상품용 안전거래 생성 */
    @Transactional
    public void createSafeOrder(Long itemId, Long buyerId, DeliveryInfo deliveryInfo) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다."));

        if (!item.getStatus().equals(ItemStatus.ON_SALE)) {
            throw new IllegalStateException("판매중인 상품만 결제할 수 있습니다.");
        }

        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new IllegalArgumentException("구매자 없음"));
        User seller = userRepository.findById(item.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("판매자 없음"));

        int safeFee = (int) Math.round(item.getPrice() * 0.035);
        int shippingFee = "included".equals(item.getDealInfo().getShippingOption()) ? 3000 : 0;
        int totalPrice = item.getPrice() + safeFee + shippingFee;

        // ✅ 포인트 차감
        if (buyer.getPoints() < totalPrice) {
            throw new IllegalStateException("포인트가 부족합니다.");
        }
        buyer.setPoints(buyer.getPoints() - totalPrice);
        userRepository.save(buyer);

        // ✅ 포인트 기록
        pointHistoryRepository.save(PointHistory.builder()
                .user(buyer)
                .amount(-totalPrice)
                .balance(buyer.getPoints())
                .type("USE")
                .description(item.getTitle() + " 안전결제 구매")
                .createdAt(Instant.now())
                .build());

        // ✅ 주문 생성
        Order order = Order.builder()
                .item(item)
                .buyerId(buyer.getId())
                .sellerId(seller.getId())
                .status(OrderStatus.PENDING)
                .price(totalPrice)
                .deliveryInfo(deliveryInfo)
                .createdAt(LocalDateTime.now())
                .build();
        orderRepository.save(order);
        log.info("📦 주문 생성 완료 → orderId={}, status={}", order.getId(), order.getStatus());

        // ✅ 아이템 상태 동기화
        item.setBuyerId(buyer.getId());
        item.setSellerId(seller.getId());
        item.setStatus(StatusMapper.toItemStatus(OrderStatus.PENDING));
        itemRepository.save(item);
        itemRepository.flush(); // 반영 보장

        // ✅ 판매자에게 메일 알림
        try {
            notificationTemplateService.sendSafeTradeMail(order, OrderStatus.PENDING);
            log.info("📧 [메일 발송 완료] 결제 완료 알림 → 판매자: {}", seller.getEmail());
        } catch (Exception e) {
            log.error("❌ [메일 발송 실패] 결제 완료 메일 실패 → {}", e.getMessage());
        }

        // ✅ 트랜잭션 커밋 후 실행될 이벤트 발행 (시스템 메시지 전송은 리스너에서 처리)
        eventPublisher.publishEvent(new SafeOrderCreatedEvent(item.getId()));

        log.info("✅ [END] 안전거래 결제 프로세스 완료 → itemId={}", item.getId());
    }


    /* ✅ 일반 + 경매 공통 수령 확인 */
    @Transactional
    public void confirmReceive(Long targetId, Long buyerId, boolean isAuction) {
        Order order = isAuction
                ? orderRepository.findByAuctionItemId(targetId)
                .orElseThrow(() -> new IllegalArgumentException("해당 경매의 주문이 존재하지 않습니다."))
                : orderRepository.findByItem_Id(targetId)
                .orElseThrow(() -> new IllegalArgumentException("해당 상품의 주문이 존재하지 않습니다."));

        if (!order.getBuyerId().equals(buyerId)) {
            throw new SecurityException("구매자만 수령 확인이 가능합니다.");
        }

        if (order.getStatus() != OrderStatus.SAFE_DELIVERY_COMPLETE) {
            throw new IllegalStateException("배송 완료 상태에서만 수령 확인이 가능합니다.");
        }

        // ✅ 상태 업데이트
        order.setStatus(OrderStatus.SAFE_DELIVERY_RECEIVED);

        if (isAuction && order.getAuctionItem() != null) {
            AuctionItem auctionItem = order.getAuctionItem();
            auctionItem.setStatus(AuctionStatus.TRADE_RECEIVED);
            auctionItemRepository.save(auctionItem);
        } else if (order.getItem() != null) {
            Item item = order.getItem();
            item.setStatus(ItemStatus.SAFE_RECEIVED);
            itemRepository.save(item);
        }

        // ✅ 판매자에게 메일
        try {
            notificationTemplateService.sendSafeTradeMail(order, OrderStatus.SAFE_DELIVERY_RECEIVED);
            log.info("📧 [메일 발송 완료] 수령 완료 알림 → 판매자: {}", order.getSellerId());
        } catch (Exception e) {
            log.error("❌ [메일 발송 실패] 수령 완료 메일 실패 → {}", e.getMessage());
        }

        // ✅ 채팅방 시스템 메시지
        Long msgTargetId = isAuction ? order.getAuctionItem().getId() : order.getItem().getId();
        chatService.sendSystemMessage(msgTargetId, "📬 구매자가 상품 수령을 완료했습니다. 포인트 지급이 진행됩니다.");
    }

    /* ✅ 일반 + 경매 공통 포인트 지급 */
    @Transactional
    public void payoutToSeller(Long targetId, Long sellerId, boolean isAuction) {
        Order order = isAuction
                ? orderRepository.findByAuctionItemId(targetId)
                .orElseThrow(() -> new IllegalArgumentException("해당 경매의 주문이 존재하지 않습니다."))
                : orderRepository.findByItem_Id(targetId)
                .orElseThrow(() -> new IllegalArgumentException("해당 상품의 주문이 존재하지 않습니다."));

        if (!order.getSellerId().equals(sellerId)) {
            throw new SecurityException("판매자만 포인트를 수령할 수 있습니다.");
        }

        if (order.getStatus() != OrderStatus.SAFE_DELIVERY_RECEIVED) {
            throw new IllegalStateException("포인트 수령 대기 상태가 아닙니다.");
        }

        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new IllegalArgumentException("판매자 없음"));

        int payoutPoint;
        if (isAuction && order.getAuctionItem() != null) {
            // ✅ 경매의 경우 낙찰가만큼 지급
            payoutPoint = order.getAuctionItem().getWinningPrice();
        } else if (order.getItem() != null) {
            // ✅ 일반 거래의 경우 상품 가격만큼 지급
            payoutPoint = order.getItem().getPrice();
        } else {
            throw new IllegalStateException("지급할 대상 상품이 없습니다.");
        }
        // ✅ 포인트 적립
        seller.setPoints(seller.getPoints() + payoutPoint);
        userRepository.save(seller);

        pointHistoryRepository.save(PointHistory.builder()
                .user(seller)
                .amount(payoutPoint)
                .balance(seller.getPoints())
                .type("EARN")
                .description(isAuction
                        ? order.getAuctionItem().getTitle() + " 경매 판매 정산 포인트 지급"
                        : order.getItem().getTitle() + " 판매 정산 포인트 지급")
                .createdAt(Instant.now())
                .build());

        // ✅ 상태 업데이트
        order.setStatus(OrderStatus.SAFE_DELIVERY_FINISHED);

        Long msgTargetId;   // 시스템 메시지/FCM clickAction 에 사용할 타겟 id


        if (isAuction && order.getAuctionItem() != null) {
            AuctionItem auctionItem = order.getAuctionItem();
            auctionItem.setStatus(AuctionStatus.TRADE_COMPLETE);
            auctionItemRepository.save(auctionItem);

            msgTargetId = auctionItem.getId();

        } else if (order.getItem() != null) {
            Item item = order.getItem();
            item.setStatus(ItemStatus.SAFE_FINISHED);
            itemRepository.save(item);

            msgTargetId = item.getId();

        } else {
            // 방어 로직: 이 경우가 나오면 알림 스킵
            log.warn("⚠️ payoutToSeller: 대상 엔티티가 없습니다. (isAuction={}, targetId={})", isAuction, targetId);
            log.info("💰 [포인트 지급 완료] 판매자ID={}, 금액={}, 타입={}", sellerId, payoutPoint, isAuction ? "경매" : "일반");
            return;
        }

        log.info("💰 [포인트 지급 완료] 판매자ID={}, 금액={}, 타입={}",
                sellerId, payoutPoint, isAuction ? "경매" : "일반");

    /* ============================
       ✅ 거래 종료 알림 (채팅 + FCM)
       ============================ */
        try {
            String systemMessage = "🎉 거래가 완료되었습니다. 포인트가 판매자에게 지급되었습니다.";

            if (isAuction) {
                // ✅ 경매용 메시지 전송
                chatService.sendSystemMessageForAuction(msgTargetId, systemMessage);
                log.info("💬 [경매 시스템 메시지 전송 완료] auctionId={}", msgTargetId);
            } else {
                // ✅ 일반 안전거래용 메시지 전송
                chatService.sendSystemMessage(msgTargetId, systemMessage);
                log.info("💬 [일반 거래 시스템 메시지 전송 완료] itemId={}", msgTargetId);
            }

        } catch (Exception e) {
            log.error("❌ [시스템 메시지 전송 실패] targetId={}, err={}", msgTargetId, e.getMessage());
        }

    }


    /* ✅ 경매 낙찰 시 자동 안전거래 생성 */
    @Transactional
    public void createSafeOrderFromAuction(AuctionItem auctionItem) {
        log.info("🧾 [OrderService] 경매 낙찰 → 안전거래 생성 시작 (AuctionItem ID={})", auctionItem.getId());

        try {
            User buyer = userRepository.findById(auctionItem.getWinnerId())
                    .orElseThrow(() -> new IllegalArgumentException("❌ 낙찰자 없음"));
            User seller = userRepository.findById(auctionItem.getSellerId())
                    .orElseThrow(() -> new IllegalArgumentException("❌ 판매자 없음"));

            if (orderRepository.findByAuctionItemId(auctionItem.getId()).isPresent()) {
                log.warn("⚠️ 이미 생성된 주문 존재 → 건너뜀");
                return;
            }

            Order order = Order.builder()
                    .auctionItem(auctionItem)
                    .buyerId(buyer.getId())
                    .sellerId(seller.getId())
                    .price(auctionItem.getWinningPrice())
                    .status(OrderStatus.SAFE_PENDING)
                    .createdAt(LocalDateTime.now())
                    .build();

            orderRepository.save(order);

            auctionItem.setStatus(AuctionStatus.FINISHED);
            auctionItemRepository.save(auctionItem);

            log.info("✅ [OrderService] 경매용 안전거래 생성 완료 → orderId={}", order.getId());
        } catch (Exception e) {
            log.error("❌ [OrderService] 경매 안전거래 생성 오류: {}", e.getMessage(), e);
        }
    }
}
