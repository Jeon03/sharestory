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
    onSubmit: (delivery: DeliveryInfo) => void;
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

    const totalPrice = price + shippingFee + safeFee;

    const handleSearchAddress = () => {
        new window.daum.Postcode({
            oncomplete: (data: DaumPostcodeData) => {
                setForm((prev) => ({ ...prev, address: data.address }));
            },
        }).open();
    };

    const handleConfirm = () => {
        const phoneRegex = /^01[0-9]-\d{3,4}-\d{4}$/;
        if (!form.name || !form.phone || !form.address) {
            alert("필수 정보를 입력하세요.");
            return;
        }
        if (!phoneRegex.test(form.phone)) {
            alert("전화번호는 010-1234-5678 형식으로 입력해주세요.");
            return;
        }
        onSubmit(form);
        onClose();
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
                                onChange={(e) => setForm({ ...form, requestMessage: e.target.value })}
                                rows={3}
                            />

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
                            >
                                취소
                            </button>
                            <button
                                className="delivery-slider-confirm-btn"
                                onClick={handleConfirm}
                            >
                                결제하기
                            </button>
                        </footer>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

}
