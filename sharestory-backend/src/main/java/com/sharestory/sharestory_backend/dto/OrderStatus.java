package com.sharestory.sharestory_backend.dto;

public enum OrderStatus {
    PENDING,              // 결제 완료 → 송장 대기
    SAFE_DELIVERY,        // 송장 등록됨
    SAFE_DELIVERY_START,  // 배송 시작
    SAFE_DELIVERY_ING,    // 배송 중
    SAFE_DELIVERY_COMPLETE, // 배송 완료
    SAFE_DELIVERY_POINT_DONE // 포인트 정산 완료 (판매자에게 지급됨)
}