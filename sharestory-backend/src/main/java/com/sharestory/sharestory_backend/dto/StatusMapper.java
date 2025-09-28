package com.sharestory.sharestory_backend.dto;

import java.util.EnumMap;
import java.util.Map;

public class StatusMapper {

    private static final Map<OrderStatus, ItemStatus> orderToItem = new EnumMap<>(OrderStatus.class);
    private static final Map<ItemStatus, OrderStatus> itemToOrder = new EnumMap<>(ItemStatus.class);

    static {
        orderToItem.put(OrderStatus.PENDING, ItemStatus.SAFE_PENDING);
        orderToItem.put(OrderStatus.SAFE_DELIVERY, ItemStatus.SAFE_READY);
        orderToItem.put(OrderStatus.SAFE_DELIVERY_START, ItemStatus.SAFE_START);
        orderToItem.put(OrderStatus.SAFE_DELIVERY_ING, ItemStatus.SAFE_ING);
        orderToItem.put(OrderStatus.SAFE_DELIVERY_COMPLETE, ItemStatus.SAFE_COMPLETE);
        orderToItem.put(OrderStatus.SAFE_DELIVERY_POINT_DONE, ItemStatus.SAFE_POINT_DONE);

        // 역매핑도 자동 등록
        orderToItem.forEach((k, v) -> itemToOrder.put(v, k));
    }

    public static ItemStatus toItemStatus(OrderStatus orderStatus) {
        return orderToItem.get(orderStatus);
    }

    public static OrderStatus toOrderStatus(ItemStatus itemStatus) {
        return itemToOrder.get(itemStatus);
    }
}