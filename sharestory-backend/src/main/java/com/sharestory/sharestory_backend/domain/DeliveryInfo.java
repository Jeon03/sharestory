package com.sharestory.sharestory_backend.domain;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryInfo {
    private String name;
    private String phone;
    private String address;
    private String detail;
    private String requestMessage;
}
