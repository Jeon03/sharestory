import { useState } from 'react';
import { useAuctionItem } from '../hooks/useAuctionItem';
import '../css/AuctionItemPage.css';
import { ItemImageSlider } from '../components/auction/ItemImageSlider';
import { ItemDetails } from '../components/auction/ItemDetails';
import { AuctionModal } from '../components/auction/AuctionModal';
import ChatSlider from '../components/chat/ChatSlider';
import { fetchWithAuth } from "../utils/fetchWithAuth";

export default function AuctionItemPage() {
    const {
        item, currentUser, loading,
        highestBid, setHighestBid,
        highestBidderName, setHighestBidderName
    } = useAuctionItem();

    const [showChat, setShowChat] = useState(false);
    const [showAuctionModal, setShowAuctionModal] = useState(false);

    /**
     * 즉시 구매를 처리하는 함수
     */
    const handleBuyNow = async () => {
        // --- [수정된 부분 1] ---
        // item이나 buyNowPrice가 null이면 함수를 실행하지 않도록 방어합니다.
        if (!item || item.buyNowPrice === null) return;

        // 사용자에게 구매 의사를 다시 한번 확인합니다.
        const buyNowPriceFormatted = new Intl.NumberFormat().format(item.buyNowPrice);
        if (!window.confirm(`${buyNowPriceFormatted}원에 즉시 구매하시겠습니까?`)) {
            return;
        }

        try {
            // 백엔드에 구현한 buyNow API를 호출합니다.
            const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/auction-items/${item.id}/buy-now`, {
                method: 'POST'
            });

            if (response.ok) {
                alert('상품을 성공적으로 구매했습니다!');
                // 구매 성공 후 메인 페이지 등으로 이동시킵니다.
                window.location.href = '/';
            } else {
                const errorText = await response.text();
                alert(`구매에 실패했습니다: ${errorText}`);
            }
        } catch (err) {
            console.error('즉시 구매 처리 중 오류 발생:', err);
            alert('구매 처리 중 오류가 발생했습니다.');
        }
    };

    if (loading) return <div className="detail-loading">상품 정보를 불러오는 중입니다...</div>;
    if (!item) return <div className="detail-loading">상품 정보가 없습니다.</div>;

    const isOwner = currentUser?.id === item.userId;

    return (
        <div className="detail-container">
            <div className="detail-main">
                <ItemImageSlider item={item} />
                <ItemDetails
                    item={item}
                    isOwner={isOwner}
                    highestBid={highestBid}
                    highestBidderName={highestBidderName}
                    onBidButtonClick={() => setShowAuctionModal(true)}
                    onChatButtonClick={() => setShowChat(true)}
                />
            </div>

            {/* 즉시 구매 버튼 UI */}
            <div className="detail-actions-wrapper">
                {!isOwner && item.buyNowPrice && item.buyNowAvailable && (
                    <button className="buy-now-button" onClick={handleBuyNow}>
                        {/* --- [수정된 부분 2] --- */}
                        {/* item.buyNowPrice가 null이 아님이 보장되므로, 포맷팅을 안전하게 실행합니다. */}
                        {new Intl.NumberFormat().format(item.buyNowPrice)}원에 즉시 구매
                    </button>
                )}
            </div>

            {/* ChatSlider는 채팅방 ID를 동적으로 받아야 할 수 있습니다. 지금은 1로 고정되어 있습니다. */}
            <ChatSlider isOpen={showChat} onClose={() => setShowChat(false)} activeRoomId={1} />

            {showAuctionModal && (
                <AuctionModal
                    isOpen={showAuctionModal}
                    onClose={() => setShowAuctionModal(false)}
                    itemTitle={item.title}
                    currentUser={currentUser}
                    highestBid={highestBid}
                    bidUnit={1000}
                    endTime={new Date(item.auctionEnd)}
                    itemId={item.id}
                    onBidSuccess={(newBid) => {
                        // 입찰 성공 시 UI 즉시 업데이트
                        setHighestBid(newBid);
                        if (currentUser) {
                            setHighestBidderName(currentUser.nickname);
                        }
                    }}
                />
            )}
        </div>
    );
}