import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import "../css/deliverySlider.css";

export interface DeliveryInfo {
    name: string;
    phone: string;
    address: string;
    detail: string;
    requestMessage?: string;
}

interface DeliverySliderProps {
    isOpen: boolean;
    onClose: () => void;
    price: number;
    shippingFee: number;
    safeFee: number;
    onSubmit: (delivery: DeliveryInfo) => Promise<void> | void;
}

export default function DeliverySlider({
                                           isOpen,
                                           onClose,
                                           price,
                                           shippingFee,
                                           safeFee,
                                           onSubmit,
                                       }: DeliverySliderProps) {
    const [form, setForm] = useState<DeliveryInfo>({
        name: "",
        phone: "",
        address: "",
        detail: "",
        requestMessage: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const totalPrice = price + shippingFee + safeFee;

    // ✅ 카카오 주소검색
    const handleSearchAddress = () => {
        new window.daum.Postcode({
            oncomplete: (data: DaumPostcodeData) => {
                setForm((prev) => ({ ...prev, address: data.address }));
            },
        }).open();
    };

    // ✅ 결제 확인 + 로딩 처리
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

        // 재확인
        const confirmed = window.confirm("정말 결제를 진행하시겠습니까?");
        if (!confirmed) return;

        try {
            setIsLoading(true); // 로딩 시작
            await onSubmit(form); // 결제 처리
            alert("✅ 결제가 완료되었습니다!");
            onClose();
        } catch (err) {
            console.error("결제 오류:", err);
            alert("❌ 결제 처리 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false); // 로딩 종료
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 배경 오버레이 */}
                    <motion.div
                        className="delivery-slider-overlay"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    />

                    {/* 사이드 패널 */}
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
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                            <input
                                name="phone"
                                placeholder="전화번호 (예: 010-1234-5678)"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
                                onChange={(e) => setForm({ ...form, detail: e.target.value })}
                            />
                            <textarea
                                name="request"
                                placeholder="배송 요청사항 (예: 부재 시 경비실에 맡겨주세요)"
                                value={form.requestMessage}
                                onChange={(e) =>
                                    setForm({ ...form, requestMessage: e.target.value })
                                }
                                rows={3}
                            />

                            {/* 요약 */}
                            <div className="delivery-slider-summary">
                                <div className="row">
                                    <span>상품 금액</span>
                                    <span>{price.toLocaleString()}원</span>
                                </div>
                                <div className="row">
                                    <span>배송비</span>
                                    <span>{shippingFee ? "3,000원" : "무료"}</span>
                                </div>
                                <div className="row">
                                    <span>수수료</span>
                                    <span>{safeFee.toLocaleString()}원</span>
                                </div>
                                <div className="row total">
                                    <span>총 결제금액</span>
                                    <span>{totalPrice.toLocaleString()}원</span>
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

                    {/* 로딩 오버레이 */}
                    {isLoading && (
                        <div className="loading-overlay">
                            <div className="spinner"></div>
                            <p>결제 진행중...</p>
                        </div>
                    )}
                </>
            )}
        </AnimatePresence>
    );
}
