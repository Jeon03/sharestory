package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.*;
import com.sharestory.sharestory_backend.dto.ItemStatus;
import com.sharestory.sharestory_backend.dto.OrderStatus;
import com.sharestory.sharestory_backend.dto.StatusMapper;
import com.sharestory.sharestory_backend.repo.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final PointHistoryRepository pointHistoryRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationTemplateService notificationTemplateService;
    private final ChatService chatService;

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

        PointHistory history = PointHistory.builder()
                .user(buyer)
                .amount(-totalPrice)  // 차감 금액
                .balance(buyer.getPoints()) // 차감 후 잔액
                .type("USE") // 사용
                .description(item.getTitle() + " 안전결제 구매")
                .build();
        pointHistoryRepository.save(history);
        // ✅ 주문 생성 (상태는 PENDING)
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

        // ✅ 아이템 상태 동기화 (StatusMapper 활용)
        item.setBuyerId(buyer.getId());
        item.setSellerId(seller.getId());

        ItemStatus mappedStatus = StatusMapper.toItemStatus(OrderStatus.PENDING);
        if (mappedStatus != null) {
            item.setStatus(mappedStatus);
        }

        itemRepository.save(item);

        // ✅ 판매자에게 결제 완료 메일 발송
        try {
            notificationTemplateService.sendSafeTradeMail(order, OrderStatus.PENDING);
            log.info("📧 [메일 발송 완료] 결제 완료 알림 → 판매자: {}", seller.getEmail());
        } catch (Exception e) {
            log.error("❌ [메일 발송 실패] 결제 완료 메일 실패 → {}", e.getMessage());
        }

        // ✅ 2. 채팅방 시스템 메시지 전송
        chatService.sendSystemMessage(item.getId(), "💰 구매자가 안전거래 결제를 완료했습니다.");
    }


    @Transactional
    public void confirmReceiveByItemId(Long itemId, Long buyerId) {
        Order order = orderRepository.findByItem_Id(itemId)
                .orElseThrow(() -> new IllegalArgumentException("해당 상품의 주문이 존재하지 않습니다."));

        if (!order.getBuyerId().equals(buyerId)) {
            throw new SecurityException("구매자만 수령 확인이 가능합니다.");
        }
        if (order.getStatus() != OrderStatus.SAFE_DELIVERY_COMPLETE) {
            throw new IllegalStateException("배송 완료 상태에서만 수령 확인이 가능합니다.");
        }

        // ✅ 주문/상품 상태 업데이트
        order.setStatus(OrderStatus.SAFE_DELIVERY_RECEIVED);
        order.getItem().setStatus(ItemStatus.SAFE_RECEIVED);
        itemRepository.save(order.getItem());


        // ✅ 판매자에게 수령 완료 메일 발송
        try {
            notificationTemplateService.sendSafeTradeMail(order, OrderStatus.SAFE_DELIVERY_RECEIVED);
            log.info("📧 [메일 발송 완료] 수령 완료 알림 → 판매자: {}", order.getSellerId());
        } catch (Exception e) {
            log.error("❌ [메일 발송 실패] 수령 완료 메일 실패 → {}", e.getMessage());
        }

        //채팅방 시스템 메시지
        chatService.sendSystemMessage(order.getItem().getId(), "📬 구매자가 상품 수령을 완료했습니다. 포인트 지급이 진행됩니다.");
    }

    @Transactional
    public void payoutToSeller(Long itemId, Long sellerId) {
        Order order = orderRepository.findByItem_Id(itemId)
                .orElseThrow(() -> new IllegalArgumentException("해당 상품의 주문이 존재하지 않습니다."));

        if (!order.getSellerId().equals(sellerId)) {
            throw new SecurityException("판매자만 포인트를 수령할 수 있습니다.");
        }
        if (order.getStatus() != OrderStatus.SAFE_DELIVERY_RECEIVED) {
            throw new IllegalStateException("포인트 수령 대기 상태가 아닙니다.");
        }

        // ✅ 판매자 찾기
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new IllegalArgumentException("판매자 없음"));

        int payoutPoint = order.getPrice(); //상품 가격 그대로 적립

        // ✅ 포인트 적립
        seller.setPoints(seller.getPoints() + payoutPoint);
        userRepository.save(seller);

        // ✅ 포인트 내역 기록
        PointHistory history = PointHistory.builder()
                .user(seller)
                .amount(payoutPoint) // 지급된 금액만 기록
                .balance(seller.getPoints())
                .type("EARN")
                .description(order.getItem().getTitle() + " 판매 정산 포인트 지급")
                .build();
        pointHistoryRepository.save(history);

        // ✅ 상태 업데이트
        order.setStatus(OrderStatus.SAFE_DELIVERY_FINISHED);
        order.getItem().setStatus(ItemStatus.SAFE_FINISHED);
        itemRepository.save(order.getItem());

    }

}
