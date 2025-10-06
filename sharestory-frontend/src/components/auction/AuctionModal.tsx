import { useState, useEffect } from 'react';
import type { User } from '../../types/auction';
import { fetchWithAuth } from '../../utils/fetchWithAuth'; // fetchWithAuth import 추가

interface AuctionModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemTitle: string;
    currentUser: User | null;
    highestBid: number;
    bidUnit: number;
    endTime: Date;
    onBidSuccess: (newBid: number) => void;
    itemId: number;
}

export function AuctionModal({
                                 isOpen, onClose, itemTitle, currentUser, highestBid,
                                 bidUnit, endTime, onBidSuccess, itemId
                             }: AuctionModalProps) {
    const [bidAmount, setBidAmount] = useState(highestBid + bidUnit);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (isOpen) setBidAmount(highestBid + bidUnit);

        const timer = setInterval(() => {
            const diff = endTime.getTime() - new Date().getTime();
            if (diff <= 0) {
                setTimeLeft('경매 종료');
                clearInterval(timer);
            } else {
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${h}시간 ${m}분 ${s}초`);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [isOpen, endTime, highestBid, bidUnit]);

    if (!isOpen) return null;

    const handleBid = async () => {
        const amount = Number(bidAmount);
        const currentUserPoints = currentUser?.points ?? 0;

        // --- 입찰 유효성 검증 (기존과 동일) ---
        if (timeLeft === '경매 종료') {
            alert('경매가 종료된 상품입니다.');
            return;
        }
        if (amount <= highestBid) {
            alert(`현재 최고 입찰가(${highestBid.toLocaleString()}원)보다 높은 금액을 입력해야 합니다.`);
            return;
        }
        if (amount > currentUserPoints) {
            alert(`보유 포인트(${currentUserPoints.toLocaleString()}P)를 초과할 수 없습니다.`);
            return;
        }
        // 입찰 단위 검증은 시작가가 0일 때도 고려해야 합니다.
        if (highestBid > 0 && (amount - highestBid) % bidUnit !== 0) {
            alert(`입찰은 ${bidUnit.toLocaleString()}원 단위로만 가능합니다.`);
            return;
        }

        // --- API 호출 (수정된 부분) ---
        try {
            // 1. API 엔드포인트를 백엔드 컨트롤러와 일치시킵니다.
            // 2. 인증을 위해 fetch -> fetchWithAuth로 변경합니다.
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/auction-items/${itemId}/bids`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bidPrice: amount }),
            });

            const result = await res.json();

            if (!res.ok) {
                // 백엔드 BidResult의 message를 사용합니다.
                throw new Error(result.message || '입찰 처리 중 오류가 발생했습니다.');
            }

            alert(`💰 ${amount.toLocaleString()}원으로 입찰을 완료했습니다!`);
            onBidSuccess(amount);
            onClose();

        } catch (error) {
            console.error("입찰 API 호출 실패:", error);
            if (error instanceof Error) {
                alert(error.message);
            } else {
                alert('알 수 없는 오류가 발생했습니다.');
            }
        }
    };

    return (
        <div className="auction-modal-overlay">
            <div className="auction-modal">
                <h2>📢 {itemTitle} 경매 참여</h2>
                <p>현재 최고 입찰가: <b>{highestBid.toLocaleString()}원</b></p>
                <p>보유 포인트: <b>{currentUser?.points.toLocaleString() ?? 0}P</b></p>
                <p>입찰 단위: <b>{bidUnit.toLocaleString()}원</b></p>
                <p>남은 시간: <b style={{color: timeLeft === '경매 종료' ? 'red' : 'inherit'}}>{timeLeft}</b></p>
                <input
                    type="number"
                    value={bidAmount}
                    min={highestBid + bidUnit}
                    step={bidUnit}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                />
                <div className="btn-group">
                    <button onClick={onClose} className="btn-cancel">취소</button>
                    <button onClick={handleBid} className="btn-confirm" disabled={timeLeft === '경매 종료'}>입찰하기</button>
                </div>
            </div>
        </div>
    );
}