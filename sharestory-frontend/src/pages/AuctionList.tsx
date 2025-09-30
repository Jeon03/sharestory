import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../css/AuctionList.css';
import '../css/productCard.css';
import { Eye, Heart, Users } from 'lucide-react';
import { Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
// @ts-expect-error swiper css has no type declarations
import 'swiper/css';
// @ts-expect-error swiper css has no type declarations
import 'swiper/css/navigation';
// @ts-expect-error swiper css has no type declarations
import 'swiper/css/pagination';

interface AuctionItemSummary {
    id: number;
    title: string;
    imageUrl: string | null;
    currentPrice: number;
    auctionEnd: string;
    status: 'ON_AUCTION' | 'AUCTION_ENDED' | 'SOLD_OUT' | string;
    sellerNickname: string;
    viewCount: number;
    favoriteCount: number;
    bidCount: number;
}

interface Page<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
}

// --- [수정됨] --- API_BASE 변수는 더 이상 사용하지 않으므로 삭제합니다.
 const API_BASE = import.meta.env.VITE_API_BASE || '';

const formatTimeRemaining = (endDateStr: string): string => {
    const endDate = new Date(endDateStr).getTime();
    const now = new Date().getTime();
    const diff = endDate - now;

    if (diff <= 0) return "경매 마감";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}일 ${hours}시간 남음`;
    if (hours > 0) return `${hours}시간 ${minutes}분 남음`;
    if (minutes > 0) return `${minutes}분 남음`;
    return "곧 마감";
};

const fetchAuctionItemsApi = async (url: string): Promise<any> => {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error(`${url} 로딩 실패`);
    return await res.json();
};

export default function AuctionList() {
    const [endingSoonItems, setEndingSoonItems] = useState<AuctionItemSummary[]>([]);
    const [popularItems, setPopularItems] = useState<AuctionItemSummary[]>([]);
    const [allItems, setAllItems] = useState<AuctionItemSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // --- [수정됨] --- 모든 API 경로 앞에 '/api'를 직접 추가합니다.
                const [endingSoon, popular, all] = await Promise.all([
                    fetchAuctionItemsApi(`${API_BASE}/auction-items/sorted/ending-soon?size=10`),
                    fetchAuctionItemsApi(`${API_BASE}/auction-items/sorted/popular?size=10`),
                    fetchAuctionItemsApi(`${API_BASE}/auction-items?page=0&size=12`)
                ]);

                setEndingSoonItems(endingSoon.content);
                setPopularItems(popular.content);
                setAllItems(all.content);
                setTotalPages(all.totalPages);

            } catch (err) {
                console.error("[API] 경매 상품 로드 실패:", err);
                setError('경매 상품을 불러올 수 없습니다.');
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (page === 0) return;
        const fetchMoreItems = async () => {
            setLoading(true);
            try {
                // --- [수정됨] --- API 경로 앞에 '/api'를 직접 추가합니다.
                const data: Page<AuctionItemSummary> = await fetchAuctionItemsApi(`${API_BASE}/auction-items?page=${page}&size=12`);
                setAllItems(prevItems => [...prevItems, ...data.content]);
                setTotalPages(data.totalPages);
            } catch (err) {
                console.error("[API] 추가 상품 로드 실패:", err);
                setError('상품을 더 불러올 수 없습니다.');
            } finally {
                setLoading(false);
            }
        };
        fetchMoreItems();
    }, [page]);

    const loadMoreItems = () => {
        if (page < totalPages - 1) {
            setPage(prevPage => prevPage + 1);
        }
    };

    const renderSwiper = (items: AuctionItemSummary[]) => (
        <Swiper
            modules={[Navigation, Pagination]}
            navigation
            spaceBetween={20}
            slidesPerView={5}
            pagination={{ clickable: true }}
            className="product-swiper"
            breakpoints={{
                1200: { slidesPerView: 5 },
                992: { slidesPerView: 4 },
                768: { slidesPerView: 3 },
                480: { slidesPerView: 2 },
                0: { slidesPerView: 1 },
            }}
        >
            {items.map(item => (
                <SwiperSlide key={item.id}>
                    <li className="product-card">
                        <Link to={`/auctions/${item.id}`} className="product-link">
                            <div className="image-wrapper">
                                <img
                                    src={item.imageUrl || '/placeholder.png'}
                                    alt={item.title}
                                    className="product-image"
                                    onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                                />
                            </div>
                            <div className="product-info">
                                <div className="favorite-and-views">
                                    <span className="count"><Users size={16} style={{ marginRight: 4 }} /> {item.bidCount}</span>
                                    <span className="count"><Heart size={16} fill="#999999" color="#999999" style={{ marginRight: 4 }} /> {item.favoriteCount}</span>
                                    <span className="count"><Eye size={16} style={{ marginRight: 4 }} /> {item.viewCount}</span>
                                </div>
                                <h3 className="product-title">{item.title}</h3>
                                <p className="product-price">{item.currentPrice.toLocaleString()}원</p>
                                <div className="product-meta">
                                    <span className="product-date" style={{color: '#d9534f'}}>
                                        {formatTimeRemaining(item.auctionEnd)}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </li>
                </SwiperSlide>
            ))}
        </Swiper>
    );

    if (error && allItems.length === 0) {
        return <div className="auction-list-container error">{error}</div>;
    }

    if (loading && allItems.length === 0) return <div className="product-list">로딩 중...</div>;

    return (
        <div className="product-list container">
            <section>
                <p className="textMain">마감 임박 경매</p>
                {renderSwiper(endingSoonItems.filter(i => i.status === 'ON_AUCTION'))}
            </section>
            <br/><br/><br/>
            <section>
                <p className="textMain">인기 경매</p>
                {renderSwiper(popularItems.filter(i => i.status === 'ON_AUCTION'))}
            </section>
            <br/><br/><br/>
            <section>
                <p className="textMain">전체 경매</p>
                <ul className="product-grid">
                    {allItems.map(item => (
                        <li key={item.id} className="product-card">
                            <Link to={`/auctions/${item.id}`} className="product-link">
                                <div className="image-wrapper">
                                    <img
                                        src={item.imageUrl || '/placeholder.png'}
                                        alt={item.title}
                                        className="product-image"
                                        onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                                    />
                                </div>
                                <div className="product-info">
                                    <div className="favorite-and-views">
                                        <span className="count"><Users size={16} style={{ marginRight: 4 }} /> {item.bidCount}</span>
                                        <span className="count"><Heart size={16} fill="#999999" color="#999999" style={{ marginRight: 4 }} /> {item.favoriteCount}</span>
                                        <span className="count"><Eye size={16} style={{ marginRight: 4 }} /> {item.viewCount}</span>
                                    </div>
                                    <h3 className="product-title">{item.title}</h3>
                                    <p className="product-price">{item.currentPrice.toLocaleString()} 원</p>
                                    <div className="product-meta">
                                         <span className="product-date" style={{color: item.status === 'ON_AUCTION' ? '#d9534f' : '#888'}}>
                                            {formatTimeRemaining(item.auctionEnd)}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
                {loading && <div className="loading-indicator">로딩 중...</div>}
                {!loading && page < totalPages - 1 && (
                    <button onClick={loadMoreItems} className="load-more-btn">
                        더 보기
                    </button>
                )}
            </section>
        </div>
    );
}