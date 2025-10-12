package com.sharestory.sharestory_backend.dto;

public enum AuctionStatus {
    ONGOING,              // ⏱ 경매 진행 중
    FINISHED,             // 🏁 경매 종료 (낙찰 완료)
    TRADE_PENDING,        // 💳 낙찰 후 결제/배송 준비 중
    TRADE_DELIVERY,       // 🚚 배송 중
    TRADE_DELIVERY_COMPLETE, // 📦 배송 완료 (수령 대기)
    TRADE_RECEIVED,       // 📥 구매자 수령 확인 완료
    TRADE_COMPLETE,       // ✅ 거래 완료 (수령 완료)
    CANCELLED
}