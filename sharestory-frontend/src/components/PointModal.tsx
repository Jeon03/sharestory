// PointModal.tsx
import React, { useState } from "react";
import "../css/PointModal.css";
import logo from "../images/logo.png";
import type { User } from "../types/user";

interface PointModalProps {
    isOpen: boolean;
    onClose: () => void;
    points: number;
    user: User | null;
    setPoints: (balance: number) => void; // ✅ number만 받도록 변경
}

const PointModal: React.FC<PointModalProps> = ({ isOpen, onClose, points , user, setPoints }) => {
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState<number | "">("");
    const [errorMessage, setErrorMessage] = useState<string>("");

    if (!isOpen) return null;

    const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, ""); // 숫자만 허용
        const num = value === "" ? 0 : Number(value);

        setCustomAmount(value === "" ? "" : num);

        if (num > 0 && num < 1000) {
            setErrorMessage("⚠ 최소 1,000원 이상 입력해야 합니다.");
        } else if (num > 0 && num % 100 !== 0) {
            setErrorMessage("⚠ 100원 단위로만 입력 가능합니다.");
        } else {
            setErrorMessage(""); // 정상 값일 경우 안내문구 초기화
        }
    };
    const handleCharge = () => {
        const amount =
            selectedAmount === -1 ? Number(customAmount) : selectedAmount;

        if (!amount || amount < 1000) {
            alert("충전 금액은 1,000원 이상부터 가능합니다.");
            return;
        }
        if (amount % 100 !== 0) {
            alert("충전 금액은 100원 단위로 입력해야 합니다.");
            return;
        }

        // ✅ 아임포트 객체 초기화
        const { IMP } = window;
        IMP.init(import.meta.env.VITE_IAMPORT_MERCHANT_CODE); // 가맹점 식별코드
        // ✅ 결제 요청
        IMP.request_pay(
            {
                pg: "html5_inicis",
                pay_method: "card",
                merchant_uid: "order_" + new Date().getTime(),
                name: "포인트 충전",
                amount: amount,
                buyer_email: user?.email ?? "",
                buyer_name: user?.nickname ?? "",
            },
            (rsp: IamportResponse) => {
                if (rsp.success) {
                    alert("포인트 적립 완료!");
                    fetch(`${import.meta.env.VITE_API_URL}/api/points/charge`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                            impUid: rsp.imp_uid,
                            merchantUid: rsp.merchant_uid,
                            amount: rsp.paid_amount,
                        }),
                    })
                        .then((res) => res.json())
                        .then((data) => {
                            setPoints(data.balance);
                            onClose();
                        })
                        .catch((err) => {
                            console.error(err);
                            alert("서버 검증 실패");
                        });
                } else {
                    alert("결제 실패: " + rsp.error_msg);
                }
            }
        );
    };

    return (
        <div className="point-modal-overlay" onClick={onClose}>
            <div className="point-modal-content" onClick={(e) => e.stopPropagation()}>

                <div className="point-modal-logo">
                    <img src={logo} alt="로고" />
                </div>
                <h2>포인트 충전</h2>

                {/* 현재 보유 포인트 */}
                <div className="point-modal-points-display">
                    <p>보유 포인트: {points.toLocaleString()} P</p>
                </div>

                {/* 충전 금액 선택 */}
                <div className="point-modal-amount-row">
                    {[1000, 5000, 10000, 50000].map((amt) => (
                        <button
                            key={amt}
                            className={`point-modal-amount-choice ${
                                selectedAmount === amt ? "selected" : ""
                            }`}
                            onClick={() => {
                                setSelectedAmount(amt);
                                setCustomAmount("");
                                setErrorMessage("");
                            }}
                        >
                            {amt.toLocaleString()} 원
                        </button>
                    ))}

                    {/* 직접 입력 버튼 */}
                    <button
                        className={`point-modal-amount-choice ${
                            selectedAmount === -1 ? "selected" : ""
                        }`}
                        onClick={() => {
                            setSelectedAmount(-1);
                            setErrorMessage("");
                        }}
                    >
                        직접 입력
                    </button>
                </div>

                {/* 직접 입력 input (직접입력 선택 시만 표시) */}
                {selectedAmount === -1 && (
                    <div className="point-modal-custom-input">
                        <div className="point-modal-input-wrapper">
                            <input
                                type="text"
                                placeholder="금액 입력"
                                value={customAmount}
                                onChange={handleCustomInput}
                            />
                            <span>원</span>
                        </div>
                        {/* 안내 문구 */}
                        <p
                            className="point-modal-input-hint"
                            style={{ color: errorMessage ? "#d9534f" : "#888" }}
                        >
                            {errorMessage || "1,000원 이상 · 100원 단위로 입력 가능합니다."}
                        </p>
                    </div>
                )}

                {/* 버튼 */}
                <div className="point-modal-buttons full">
                    <button onClick={handleCharge} className="point-modal-charge-button big">
                        결제하기
                    </button>
                    <button onClick={onClose} className="point-modal-close-button">
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PointModal;