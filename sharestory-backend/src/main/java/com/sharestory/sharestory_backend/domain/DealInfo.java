package com.sharestory.sharestory_backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.Setter;

@Embeddable
@Getter
@Setter
public class DealInfo {
    @Column(name = "parcel")
    private Boolean parcel;

    @Column(name = "direct")
    private Boolean direct;

    @Column(name = "shipping_option")
    private String shippingOption;

    @Transient
    private String phoneNumber; // ✅ DB에 저장하지 않음 (프론트에서만 입력)

    @Column(name = "safe_trade")
    private Boolean safeTrade;  // 읽기 전용
    @Column(name = "is_auction") // DB 컬럼명이 is_auction일 경우
    private Boolean auction;
}