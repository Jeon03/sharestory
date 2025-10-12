import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import "../css/deliverySlider.css";
import type { DeliveryInfo } from "../api/delivery";

interface AuctionDeliverySliderProps {
    isOpen: boolean;
    onClose: () => void;
    price: number; // 상품금액 (표시용)
    shippingFee: number; // 항상 3,000원
    safeFee: number; // 3.5% 수수료
    onSubmit: (delivery: DeliveryInfo) => Promise<void> | void;
}

export default function AuctionDeliverySlider({
                                                  isOpen,
                                                  onClose,
                                                  price,
                                                  shippingFee,
                                                  safeFee,
                                                  onSubmit,
                                              }: AuctionDeliverySliderProps) {
    const [form, setForm] = useState<DeliveryInfo>({
        name: "",
        phone: "",
        address: "",
        detail: "",
        requestMessage: "",
    });
    const [isLoading, setIsLoading] = useState(false);

    // ✅ 상품가는 제외, 배송비 + 수수료만 결제
    const totalPay = shippingFee + safeFee;

    // ✅ 주소 검색
    const handleSearchAddress = () => {
        new window.daum.Postcode({
            oncomplete: (data: DaumPostcodeData) => {
                setForm((prev) => ({ ...prev, address: data.address }));
            },
        }).open();
    };

    // ✅ 결제 처리
    const handleConfirm = async () => {
        const phoneRegex = /^01[0-9]-\d{3,4}-\d{4}$/;
        if (!form.name || !form.phone || !form.address) {
            alert("필수 정보를 입력하세요.");
            return;
        }
        if (!phoneRegex.test(form.phone)) {
            alert("전화번호는 010-1234-5678 형식으로 입력해주세요.");
            return;
        }

        const confirmed = window.confirm(
            `배송비(${shippingFee.toLocaleString()}원)와 안전거래 수수료(${safeFee.toLocaleString()}원)를 결제하시겠습니까?`
        );
        if (!confirmed) return;

        try {
            setIsLoading(true);


            // ✅ 2단계: 배송정보 등록
            await onSubmit(form);

            alert(
                `✅ 결제가 완료되었습니다!\n\n` +
                `- 결제 항목: 배송비 + 안전거래 수수료\n` +
                `- 낙찰 금액은 이미 결제되어 있습니다.\n` +
                `- 판매자가 송장을 등록하면 배송이 시작됩니다.`
            );

            onClose();
        } catch (err: unknown) {
            // ✅ Axios-like 에러 타입 세이프 검사
            if (
                typeof err === "object" &&
                err !== null &&
                "response" in err &&
                (err as { response?: { data?: { message?: string } } }).response
            ) {
                const responseData = (err as {
                    response?: { data?: { message?: string } };
                }).response?.data;
                const message =
                    responseData?.message ??
                    "❌ 결제 처리 중 오류가 발생했습니다.";
                console.error("🚨 서버 오류:", responseData);
                alert(message);
            } else {
                console.error("❌ 예상치 못한 오류:", err);
                alert("❌ 알 수 없는 오류가 발생했습니다.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="delivery-slider-overlay"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    />

                    <motion.div
                        className="delivery-slider-panel"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "tween", duration: 0.3 }}
                    >
                        <header className="delivery-slider-header">
                            <h2>배송 정보 입력</h2>
                            <button onClick={onClose}>✕</button>
                        </header>

                        <main className="delivery-slider-body">
                            <input
                                name="name"
                                placeholder="받는 사람 이름"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                            />
                            <input
                                name="phone"
                                placeholder="전화번호 (예: 010-1234-5678)"
                                value={form.phone}
                                onChange={(e) =>
                                    setForm({ ...form, phone: e.target.value })
                                }
                            />
                            <div className="delivery-slider-address-row">
                                <input
                                    name="address"
                                    placeholder="주소"
                                    value={form.address}
                                    readOnly
                                />
                                <button
                                    className="delivery-slider-address-btn"
                                    onClick={handleSearchAddress}
                                >
                                    주소찾기
                                </button>
                            </div>
                            <input
                                name="detail"
                                placeholder="상세주소"
                                value={form.detail}
                                onChange={(e) =>
                                    setForm({ ...form, detail: e.target.value })
                                }
                            />
                            <textarea
                                name="request"
                                placeholder="배송 요청사항"
                                value={form.requestMessage}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        requestMessage: e.target.value,
                                    })
                                }
                                rows={3}
                            />

                            {/* 결제 요약 */}
                            <div className="delivery-slider-summary">
                                <div className="row">
                                    <span>상품 금액</span>
                                    <span>{price.toLocaleString()}원</span>
                                </div>
                                <div className="row">
                                    <span>배송비</span>
                                    <span>{shippingFee.toLocaleString()}원</span>
                                </div>
                                <div className="row">
                                    <span>안전거래 수수료</span>
                                    <span>{safeFee.toLocaleString()}원</span>
                                </div>
                                <div className="row total">
                                    <span>결제할 금액</span>
                                    <span>{totalPay.toLocaleString()}원</span>
                                </div>
                            </div>
                        </main>

                        <footer className="delivery-slider-footer">
                            <button
                                className="delivery-slider-cancel-btn"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                취소
                            </button>
                            <button
                                className="delivery-slider-confirm-btn"
                                onClick={handleConfirm}
                                disabled={isLoading}
                            >
                                {isLoading ? "결제 진행중..." : "결제하기"}
                            </button>
                        </footer>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
