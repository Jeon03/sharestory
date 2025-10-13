import { useState } from "react";
import "../css/auctionBidModal.css";

interface AuctionBidModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPrice: number;
    bidUnit: number;
    onConfirm: (bidPrice: number) => void;
}

export default function AuctionBidModal({
                                            isOpen,
                                            onClose,
                                            currentPrice,
                                            bidUnit,
                                            onConfirm,
                                        }: AuctionBidModalProps) {
    const [bidStep, setBidStep] = useState(1); // 몇 단위 올릴지

    if (!isOpen) return null;

    const bidPrice = currentPrice + bidUnit * bidStep;
    const increase = () => setBidStep((prev) => prev + 1);
    const decrease = () => {
        if (bidStep > 1) setBidStep((prev) => prev - 1);
    };

    const handleConfirm = () => {
        onConfirm(bidPrice);
        onClose();
    };

    return (
        <div className="auction-bid-modal-backdrop">
            <div className="auction-bid-modal">
                <h3>입찰하기</h3>
                <p>
                    현재가: <strong>{(currentPrice ?? 0).toLocaleString()}원</strong>
                </p>
                <p>입찰 단위: +{(bidUnit ?? 0).toLocaleString()}원</p>

                <div className="auction-bid-stepper">
                    <button onClick={decrease} disabled={bidStep <= 1}>
                        –
                    </button>
                    <span>{bidStep}단계</span>
                    <button onClick={increase}>＋</button>
                </div>

                <p className="auction-bid-total">
                    입찰 금액: <strong>{(bidPrice ?? 0).toLocaleString()}원</strong>
                </p>

                <div className="auction-bid-btns">
                    <button className="confirm" onClick={handleConfirm}>
                        확인
                    </button>
                    <button className="cancel" onClick={onClose}>
                        취소
                    </button>
                </div>
            </div>
        </div>
    );
}
