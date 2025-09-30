// AuctionItemPage.tsx - 수정 후 최종 코드

import { useState } from 'react';
import { useAuctionItem } from '../hooks/useAuctionItem';
import '../css/AuctionItemPage.css';
import { ItemImageSlider } from '../components/auction/ItemImageSlider';
import { ItemDetails } from '../components/auction/ItemDetails';
import { AuctionModal } from '../components/auction/AuctionModal';
import ChatSlider from '../components/chat/ChatSlider';
// --- [추가된 코드 1] ---
import { fetchWithAuth } from "../utils/fetchWithAuth"; // API 요청을 위해 import

export default function AuctionItemPage() {
    const {
        item, currentUser, loading,
        highestBid, setHighestBid,
        highestBidderName, setHighestBidderName
    } = useAuctionItem();

    const [showChat, setShowChat] = useState(false);
    const [showAuctionModal, setShowAuctionModal] = useState(false);

    // --- [추가된 코드 블록 2] ---
    /**
     * 새로운 입찰 발생 시 백엔드에 푸시 알림을 요청하는 함수
     */
    const triggerBidNotification = (itemId: number, newBid: number) => {
        fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/auctions/notify-bid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                itemId: itemId,
                bidAmount: newBid,
            }),
        }).catch(err => console.error('🔔 입찰 알림 요청 실패:', err));
    };
    // --- [추가된 코드 블록 끝] ---

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
                        // 기존 입찰 성공 로직
                        setHighestBid(newBid);
                        if (currentUser) {
                            setHighestBidderName(currentUser.nickname);
                        }
                        // --- [추가된 코드 3] ---
                        // 새로운 입찰이 발생했음을 서버에 알려 푸시 알림을 보냅니다.
                        triggerBidNotification(item.id, newBid);
                    }}
                />
            )}
        </div>
    );
}