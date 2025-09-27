// src/components/PurchaseSlider.tsx
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import "../css/purchase.css";
import { MapPin } from "lucide-react";

interface DealInfo {
    parcel?: boolean;
    direct?: boolean;
    safeTrade?: boolean;
    shippingOption?: "included" | "separate" | "";
    phoneNumber?: string | null;
}

interface PurchaseSliderProps {
    isOpen: boolean;
    onClose: () => void;
    price: number;
    dealInfo: DealInfo;
    latitude?: number;
    longitude?: number;
    onChatStart?: (presetMessage?: string) => void;
    onPaymentStart?: () => void;  // 결제하기 버튼 콜백
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const locationCache = new Map<string, string>();
const fetchRegionName = async (lat: number, lng: number): Promise<string> => {
    const key = `${lat},${lng}`;
    if (locationCache.has(key)) return locationCache.get(key)!;

    try {
        const res = await fetch(`${API_BASE}/api/map/region?lat=${lat}&lng=${lng}`, {
            credentials: "include",
        });
        if (!res.ok) return "알 수 없음";
        const data = await res.json();
        const loc = data.documents?.[0]?.region_3depth_name || "알 수 없음";
        locationCache.set(key, loc);
        return loc;
    } catch {
        return "알 수 없음";
    }
};

export default function PurchaseSlider({
                                           isOpen,
                                           onClose,
                                           price,
                                           dealInfo,
                                           latitude,
                                           longitude,
                                           onChatStart,
                                           onPaymentStart,
                                       }: PurchaseSliderProps) {
    const [tab, setTab] = useState<"chat" | "safe">("chat");
    const [locationName, setLocationName] = useState<string>("");
    const [showSummary, setShowSummary] = useState(false);
    // ✅ 좌표 → 위치명 변환
    useEffect(() => {
        if (!latitude || !longitude) return;
        (async () => {
            const region = await fetchRegionName(latitude, longitude);
            setLocationName(region);
        })();
    }, [latitude, longitude]);

// ✅ 요약 계산
    const SHIPPING_FEE = dealInfo.shippingOption === "included" ? 3000 : 0;
    const SAFE_TRADE_FEE = Math.round(price * 0.035);
    const totalPrice = price + SHIPPING_FEE + SAFE_TRADE_FEE;


    const [selectedDeal, setSelectedDeal] = useState<"parcel" | "direct" | null>(null);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 오버레이 */}
                    <motion.div
                        className="purchase-overlay"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    />

                    {/* 패널 */}
                    <motion.div
                        className="purchase-panel"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "tween", duration: 0.3 }}
                    >
                        {/* 헤더 */}
                        <header className="purchase-header">
                            <button className="purchase-back-btn" onClick={onClose}>
                                ←
                            </button>
                            <h2 className="purchase-title">거래 방식 선택</h2>
                            <button className="purchase-close-btn" onClick={onClose}>
                                ✕
                            </button>
                        </header>

                        {/* 탭 */}
                        <div className="purchase-tabs">
                            <div
                                className={`purchase-tab ${tab === "chat" ? "active" : ""}`}
                                onClick={() => setTab("chat")}
                            >
                                채팅거래
                            </div>
                            {dealInfo.safeTrade && (
                                <div
                                    className={`purchase-tab ${tab === "safe" ? "active" : ""}`}
                                    onClick={() => setTab("safe")}
                                >
                                    안전거래
                                </div>
                            )}
                        </div>

                        {/* 본문 */}
                        <main className="purchase-body">
                            {/* --- 채팅거래 탭 --- */}
                            {tab === "chat" && (
                                <div>
                                    <p className="purchase-desc">판매자와 채팅을 통해 직접 거래를 진행하세요.</p>

                                    {/* 택배거래 */}
                                    {dealInfo.parcel && (
                                        <div
                                            className={`purchase-card ${selectedDeal === "parcel" ? "selected" : ""}`}
                                            onClick={() => setSelectedDeal("parcel")}
                                        >
                                            <div className="purchase-card-left">
                                                <p className="purchase-card-title">택배거래</p>
                                                <div className="purchase-card-desc-row">
                          <span className="purchase-card-desc">
                            {dealInfo.shippingOption === "included"
                                ? "배송비 별도 상품입니다."
                                : "배송비 무료 상품입니다."}
                          </span>
                                                    <span className="purchase-card-emoji">🚚</span>
                                                </div>
                                                <p className="purchase-card-highlight">
                                                    배송비{" "}
                                                    {dealInfo.shippingOption === "included" ? "별도" : "무료배송"}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* 직거래 */}
                                    {dealInfo.direct && (
                                        <div
                                            className={`purchase-card ${selectedDeal === "direct" ? "selected" : ""}`}
                                            onClick={() => setSelectedDeal("direct")}
                                        >
                                            <div className="purchase-card-left">
                                                <p className="purchase-card-title">만나서 직거래</p>
                                                <div className="purchase-card-desc-row">
                                                    <span className="purchase-card-desc">상품을 직접 받을 수 있어요</span>
                                                    <span className="purchase-card-emoji">🙋‍♂️</span>
                                                </div>
                                                <p className="purchase-location">
                                                    <MapPin
                                                        size={22}
                                                        color="white"
                                                        fill="#777"
                                                        style={{ marginRight: "3px" , marginBottom:"-4px"}}
                                                    />
                                                    {locationName || "위치 정보 없음"}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* --- 안전거래 탭 --- */}
                            {tab === "safe" && dealInfo.safeTrade && dealInfo.parcel && (
                                <div>
                                    <p className="purchase-desc">안전결제를 통해 보다 안전하게 거래할 수 있습니다.</p>
                                    <div className="purchase-card">
                                        <div className="purchase-card-left">
                                            <p className="purchase-card-title">택배거래</p>
                                            <div className="purchase-card-desc-row">
                        <span className="purchase-card-desc">
                          {dealInfo.shippingOption === "included"
                              ? "배송비 별도 상품입니다."
                              : "배송비 무료 상품입니다."}
                        </span>
                                                <span className="purchase-card-emoji">💳</span>
                                            </div>
                                            <p className="purchase-card-highlight">
                                                예상 결제금액: {totalPrice.toLocaleString()}원
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </main>

                        {/* --- 하단 요약탭 --- */}
                        <div
                            className="purchase-summary-toggle"
                            onClick={() => setShowSummary(!showSummary)}
                        >
                            <span>예상 결제금액</span>
                            <span className="total-amount">
                {totalPrice.toLocaleString()}원
                <span className="arrow">{showSummary ? "▼" : "▲"}</span>
              </span>
                        </div>

                        <AnimatePresence>
                            {showSummary && (
                                <motion.div
                                    className="purchase-summary"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    <div className="purchase-row">
                                        <span>상품 금액</span>
                                        <span>{price.toLocaleString()}원</span>
                                    </div>
                                    <div className="purchase-row">
                                        <span>배송비</span>
                                        <span>
          {dealInfo.shippingOption === "included" ? "3,000원" : "무료배송"}
        </span>
                                    </div>
                                    <div className="purchase-row">
                                        <span>안심결제 수수료 3.5%</span>
                                        <span>{SAFE_TRADE_FEE.toLocaleString()}원</span>
                                    </div>
                                    <p className="purchase-fee-note">(결제수단/프로모션에 따라 변동)</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 하단 버튼 */}
                        <footer className="purchase-footer">
                            {tab === "chat" ? (
// 채팅하기 버튼
                                <button
                                    className="purchase-btn"
                                    onClick={() => {
                                        let preset: string | undefined;
                                        if (selectedDeal === "direct")
                                            preset = "안녕하세요, 직거래로 구매를 희망합니다.";
                                        if (selectedDeal === "parcel")
                                            preset = "안녕하세요, 택배 거래로 구매를 희망합니다";
                                        onChatStart?.(preset);
                                        onClose();
                                    }}
                                    disabled={!selectedDeal}
                                >
                                    채팅하기
                                </button>
                            ) : (
                                <button
                                    className="purchase-btn"
                                    onClick={() => {
                                        onPaymentStart?.();
                                        onClose();
                                    }}
                                >
                                    결제하기
                                </button>
                            )}
                        </footer>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
