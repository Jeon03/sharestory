package com.sharestory.sharestory_backend.dto;


import com.sharestory.sharestory_backend.domain.DeliveryInfo;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SafeOrderRequest {
    private Long itemId;
    private DeliveryInfo deliveryInfo;
}