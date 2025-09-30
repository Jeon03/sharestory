import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { ItemDetail } from '../../types/auction';

interface ItemDetailsProps {
    item: ItemDetail;
    isOwner: boolean;
    highestBid: number;
    highestBidderName: string | null;
    onBidButtonClick: () => void;
    onChatButtonClick: () => void;
}

export function ItemDetails({ item, isOwner, highestBid, highestBidderName, onBidButtonClick, onChatButtonClick }: ItemDetailsProps) {
    // ✅ navigate 훅을 여기서 사용합니다.
    const navigate = useNavigate();
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteCount, setFavoriteCount] = useState(item.favoriteCount);

    const toggleFavorite = () => {
        setIsFavorite(!isFavorite);
        setFavoriteCount(prev => (isFavorite ? prev - 1 : prev + 1));
    };

    const handleDelete = () => {
        if (!window.confirm('정말로 이 상품을 삭제하시겠습니까?')) return;
        alert('상품이 삭제되었습니다. (API 연동 필요)');
        navigate('/');
    };

    return (
        <div className="detail-info">
            <nav className="breadcrumb">
                <Link to="/">홈</Link> &gt; <Link to={`/category/${item.category}`}>{item.category}</Link>
            </nav>
            <h1 className="detail-title">{item.title}</h1>
            <p className="detail-price">시작가 {item.minPrice.toLocaleString()}원</p>
            <button onClick={toggleFavorite} className="favorite-btn">
                {isFavorite ? <Heart fill="red" /> : <Heart />}
                <span>{favoriteCount}</span>
            </button>
            <div className="detail-description">
                {item.description.split('\n').map((line, i) => <p key={i}>{line}</p>)}
            </div>
            <table className="detail-table">
                <tbody>
                <tr><th>상품상태</th><td>{item.condition ?? '-'}</td></tr>
                <tr><th>거래방식</th><td>
                    <button onClick={onBidButtonClick} className="auction-btn">물품경매</button>
                </td></tr>
                <tr><th>현재 최고 입찰가</th><td>
                    <b>{highestBid.toLocaleString()}원</b>
                    {highestBidderName && <span>({highestBidderName}님)</span>}
                </td></tr>
                </tbody>
            </table>
            {isOwner ? (
                <div className="owner-actions">
                    <button className="edit-btn" onClick={() => navigate(`/items/${item.id}/edit`)}>수정하기</button>
                    <button className="delete-btn" onClick={handleDelete}>삭제하기</button>
                </div>
            ) : (
                <button onClick={onChatButtonClick} className="chat-btn">💬 채팅하기</button>
            )}
        </div>
    );
}