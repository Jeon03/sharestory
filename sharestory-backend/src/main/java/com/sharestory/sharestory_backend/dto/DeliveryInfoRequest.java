package com.sharestory.sharestory_backend.dto;

import com.sharestory.sharestory_backend.domain.DeliveryInfo;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryInfoRequest {
    private String name;
    private String phone;
    private String address;
    private String detail;
    private String requestMessage;

    public DeliveryInfo toEntity() {
        return DeliveryInfo.builder()
                .name(name)
                .phone(phone)
                .address(address)
                .detail(detail)
                .requestMessage(requestMessage)
                .build();
    }
}
