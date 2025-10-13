package com.sharestory.sharestory_backend.dto;

import java.util.EnumMap;
import java.util.Map;

public class AuctionStatusMapper {

    private static final Map<OrderStatus, AuctionStatus> orderToAuction = new EnumMap<>(OrderStatus.class);

    static {
        // 💳 결제 완료 / 송장 대기
        orderToAuction.put(OrderStatus.SAFE_PENDING, AuctionStatus.TRADE_PENDING);

        // 🚚 송장 등록 / 배송 중
        orderToAuction.put(OrderStatus.SAFE_DELIVERY, AuctionStatus.TRADE_DELIVERY);
        orderToAuction.put(OrderStatus.SAFE_DELIVERY_START, AuctionStatus.TRADE_DELIVERY);
        orderToAuction.put(OrderStatus.SAFE_DELIVERY_ING, AuctionStatus.TRADE_DELIVERY);

        // 📦 배송 완료 → 수령 대기
        orderToAuction.put(OrderStatus.SAFE_DELIVERY_COMPLETE, AuctionStatus.TRADE_DELIVERY_COMPLETE);

        // ✅ 수령 완료 ~ 포인트 정산 완료
        orderToAuction.put(OrderStatus.SAFE_DELIVERY_RECEIVED, AuctionStatus.TRADE_RECEIVED);
        orderToAuction.put(OrderStatus.SAFE_DELIVERY_FINISHED, AuctionStatus.TRADE_COMPLETE);
    }

    public static AuctionStatus toAuctionStatus(OrderStatus orderStatus) {
        return orderToAuction.getOrDefault(orderStatus, AuctionStatus.FINISHED);
    }
}
