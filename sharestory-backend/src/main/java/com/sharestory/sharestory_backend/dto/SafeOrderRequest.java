package com.sharestory.sharestory_backend.dto;


import com.sharestory.sharestory_backend.domain.DeliveryInfo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SafeOrderRequest {
    private Long itemId;
    private DeliveryInfo deliveryInfo;
}