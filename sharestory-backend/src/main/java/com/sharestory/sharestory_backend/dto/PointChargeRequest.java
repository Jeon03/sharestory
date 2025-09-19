// PointChargeRequest.java
package com.sharestory.sharestory_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PointChargeRequest {
    private String impUid;       // 아임포트 결제 고유번호
    private String merchantUid;  // 가맹점 주문번호
    private int amount;          // 결제 금액
}
