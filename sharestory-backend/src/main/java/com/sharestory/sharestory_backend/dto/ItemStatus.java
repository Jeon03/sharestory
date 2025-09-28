package com.sharestory.sharestory_backend.dto;

public enum ItemStatus {
    ON_SALE,       // 판매중
    RESERVED,      // 예약중
    SOLD_OUT,      // 판매완료

    SAFE_PENDING,  // 결제 완료 → 송장 대기
    SAFE_READY,    // 송장 등록됨
    SAFE_START,    // 배송 시작
    SAFE_ING,      // 배송 중
    SAFE_COMPLETE, // 배송 완료
    SAFE_POINT_DONE // 포인트 지급 완료
}