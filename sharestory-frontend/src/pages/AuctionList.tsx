import { useEffect, useState } from 'react';
import '../css/list.css';
import '../css/productCard.css';
import { Link } from 'react-router-dom';
import { Eye, Heart, MessageCircle } from 'lucide-react';

interface AuctionItem {
    id: number;
    title: string;
    startPrice: number;
    immediatePrice?: number;
    imageUrl: string;
    createdDate: string;
    itemStatus: string;
    favoriteCount: number;
    viewCount: number;
    chatRoomCount: number;
    category?: string;
    location?: string;
    modified?: boolean;
    updatedDate?: string;
}

const API_BASE = import.meta?.env?.VITE_API_BASE || '';

// 상대시간 포맷 함수
const formatTimeAgo = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    const created = new Date(dateStr).getTime();
    if (Number.isNaN(created)) return '';
    const now = Date.now();
    const diffMs = Math.max(0, now - created);

    const sec = Math.floor(diffMs / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);

    if (day > 0) return `${day}일 전`;
    if (hr > 0) return `${hr}시간 전`;
    if (min > 0) return `${min}분 전`;
    return '방금 전';
};

export default function AuctionList() {
    const [auctionItems, setAuctionItems] = useState<AuctionItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/auction/all`, { credentials: 'include' });
                if (!res.ok) throw new Error('경매상품 불러오기 실패');
                const data: AuctionItem[] = await res.json();
                setAuctionItems(data);
            } catch (err) {
                console.error('[API] 경매상품 로드 실패:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <div className="product-list">로딩 중...</div>;

    return (
        <div className="product-list container">
            <section>
                <p className="textMain">전체 경매상품</p>
                <ul className="product-grid">
                    {auctionItems.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
                            현재 진행 중인 경매 상품이 없습니다.
                        </p>
                    ) : (
                        auctionItems.map(item => (
                            <li key={item.id} className="product-card">
                                <Link to={`/auction/${item.id}`} className="product-link">
                                    <div className="image-wrapper">
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="product-image"
                                            onError={e => {
                                                e.currentTarget.src = '/placeholder.png';
                                            }}
                                        />
                                    </div>

                                    <div className="product-info">
                                        <div className="favorite-and-views">
                      <span className="count">
                        <MessageCircle size={16} style={{ marginRight: 4 }} /> {item.chatRoomCount}
                      </span>
                                            <span className="count">
                        <Heart
                            size={16}
                            fill="#999999"
                            color="#999999"
                            style={{ marginRight: 4 }}
                        />{' '}
                                                {item.favoriteCount}
                      </span>
                                            <span className="count">
                        <Eye size={16} style={{ marginRight: 4 }} /> {item.viewCount}
                      </span>
                                        </div>

                                        <h3 className="product-title">{item.title}</h3>

                                        <p className="product-price">
                                            시작가 {item.startPrice.toLocaleString()}원
                                            {item.immediatePrice && (
                                                <span style={{ color: '#007bff', marginLeft: '8px' }}>
                          즉시구매 {item.immediatePrice.toLocaleString()}원
                        </span>
                                            )}
                                        </p>

                                        <div className="product-meta">
                                            {item.category && <span className="location">{item.category}</span>}
                                            <span> · </span>
                                            <span className="product-date">
                        {formatTimeAgo(item.createdDate)}
                                                {item.modified && (
                                                    <span
                                                        style={{
                                                            marginLeft: '4px',
                                                            fontSize: '0.85em',
                                                            color: '#888',
                                                        }}
                                                    >
                            (수정됨)
                          </span>
                                                )}
                      </span>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))
                    )}
                </ul>
            </section>
        </div>
    );
}
