package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.*;
import com.sharestory.sharestory_backend.dto.ItemStatus;
import com.sharestory.sharestory_backend.dto.OrderStatus;
import com.sharestory.sharestory_backend.dto.StatusMapper;
import com.sharestory.sharestory_backend.repo.ItemRepository;
import com.sharestory.sharestory_backend.repo.OrderRepository;
import com.sharestory.sharestory_backend.repo.PointHistoryRepository;
import com.sharestory.sharestory_backend.repo.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final PointHistoryRepository pointHistoryRepository;

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
    }
}
