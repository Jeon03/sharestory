import {useEffect, useState} from 'react';
import '../css/list.css';
import {Link} from 'react-router-dom';
import {Eye, Heart, MessageCircle} from 'lucide-react';
import {Navigation, Pagination} from 'swiper/modules';
import {Swiper, SwiperSlide} from 'swiper/react';
// @ts-expect-error swiper css has no type declarations
import 'swiper/css';
// @ts-expect-error swiper css has no type declarations
import 'swiper/css/navigation';
// @ts-expect-error swiper css has no type declarations
import 'swiper/css/pagination';
import BannerSlider from "../components/BannerSlider.tsx";

interface ProductItem {
    id: number;
    title: string;
    price: number;
    imageUrl: string;
    createdDate: string;
    itemStatus: 'ON_SALE' | 'SOLD_OUT' | string;
    favoriteCount: number;
    viewCount: number;
    chatRoomCount: number;
    safeTrade: boolean;
    latitude?: number;
    longitude?: number;
    location?: string;
    modified?: boolean;      // 수정 여부
    updatedDate?: string;
}

const API_BASE = import.meta?.env?.VITE_API_BASE || '';

// 상대시간 포맷
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

// 캐시
const locationCache = new Map<string, string>();
const fetchRegionName = async (lat: number, lng: number): Promise<string> => {
    const key = `${lat},${lng}`;
    if (locationCache.has(key)) return locationCache.get(key)!;

    const res = await fetch(`${API_BASE}/api/map/region?lat=${lat}&lng=${lng}`, {
        credentials: 'include'
    });
    if (!res.ok) return '알 수 없음';
    const data = await res.json();
    const loc = data.documents?.[0]?.region_3depth_name || '알 수 없음';
    locationCache.set(key, loc);
    return loc;
};

// 공통 fetch
const fetchItems = async (url: string): Promise<ProductItem[]> => {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error(`${url} 실패`);
    const data: ProductItem[] = await res.json();
    return await Promise.all(
        data.map(async (item) => {
            let location = '알 수 없음';
            try {
                if (item.latitude && item.longitude) {
                    location = await fetchRegionName(item.latitude, item.longitude);
                }
            } catch {
                //
            }
            return { ...item, location };
        })
    );
};

export default function ProductList() {
    const [latestItems, setLatestItems] = useState<ProductItem[]>([]);
    const [favorites, setFavorites] = useState<ProductItem[]>([]);
    const [views, setViews] = useState<ProductItem[]>([]);
    const [allItems, setAllItems] = useState<ProductItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [latest, fav, view, all] = await Promise.all([
                    fetchItems(`${API_BASE}/api/items/sorted/latest`),
                    fetchItems(`${API_BASE}/api/items/sorted/favorites`),
                    fetchItems(`${API_BASE}/api/items/sorted/views`),
                    fetchItems(`${API_BASE}/api/allItems`),
                ]);
                setLatestItems(latest.slice(0, 12));
                setFavorites(fav.slice(0, 12));
                setViews(view.slice(0, 12));
                setAllItems(all);
            } catch (err) {
                console.error('[API] 상품 로드 실패:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const renderSwiper = (items: ProductItem[]) => (
        <Swiper
            modules={[Navigation, Pagination]}
            navigation
            spaceBetween={20}
            slidesPerView={6}
            pagination={{ clickable: true }}
            className="product-swiper"
        >
            {items.map(item => (
                <SwiperSlide key={item.id}>
                    <li className="product-card">
                        {item.safeTrade && <div className="badge-safe">안전거래</div>}
                        <Link to={`/items/${item.id}`} className="product-link">
                            <img src={item.imageUrl} alt={item.title} className="product-image"
                                 onError={(e) => { e.currentTarget.src = '/placeholder.png'; }} />
                            <div className="product-info">
                                <div className="favorite-and-views">
                                    <span className="count"><MessageCircle size={16} style={{ marginRight: 4 }} /> {item.chatRoomCount}</span>
                                    <span className="count"><Heart size={16} fill="#999999" color="#999999" style={{ marginRight: 4 }} /> {item.favoriteCount}</span>
                                    <span className="count"><Eye size={16} style={{ marginRight: 4 }} /> {item.viewCount}</span>
                                </div>
                                <h3 className="product-title">{item.title}</h3>
                                <p className="product-price">{item.price.toLocaleString()}원</p>
                                <div className="product-meta">
                                    <span className="location">{item.location}</span>
                                    <span> · </span>
                                    <span className="product-date">
                                        {formatTimeAgo(item.createdDate)}
                                        {item.modified && (
                                            <span style={{ marginLeft: "4px", fontSize: "0.85em", color: "#888" }}>
                                                (수정됨)
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </li>
                </SwiperSlide>
            ))}
        </Swiper>
    );

    if (loading) return <div className="product-list">로딩 중...</div>;

    return (
        <div className="product-list container">
            <BannerSlider />
            <section>
                <p className="textMain">최신 등록 상품</p>
                {renderSwiper(latestItems.filter(i => i.itemStatus === 'ON_SALE'))}
            </section>
            <br/><br/><br/>
            <section>
                <p className="textMain">관심이 많은 상품</p>
                {renderSwiper(favorites.filter(i => i.itemStatus === 'ON_SALE'))}
            </section>
            <br/><br/><br/>
            <section>
                <p className="textMain">많이 본 상품</p>
                {renderSwiper(views.filter(i => i.itemStatus === 'ON_SALE'))}
            </section>
            <br/><br/><br/>
            <section>
                <p className="textMain">전체 상품</p>
                <ul className="grid">
                    {allItems
                        .filter(i => i.itemStatus === 'ON_SALE')
                        .map(item => (
                            <li key={item.id} className="product-card">
                                {item.safeTrade && <div className="badge-safe">안전거래</div>}
                                <Link to={`/items/${item.id}`} className="product-link">
                                    <img src={item.imageUrl} alt={item.title} className="product-image"
                                         onError={(e) => { e.currentTarget.src = '/placeholder.png'; }} />
                                    <div className="product-info">
                                        <div className="favorite-and-views">
                                            <span className="count"><MessageCircle size={16} style={{ marginRight: 4 }} /> {item.chatRoomCount}</span>
                                            <span className="count"><Heart size={16} fill="#999999" color="#999999" style={{ marginRight: 4 }} /> {item.favoriteCount}</span>
                                            <span className="count"><Eye size={16} style={{ marginRight: 4 }} /> {item.viewCount}</span>
                                        </div>
                                        <h3 className="product-title">{item.title}</h3>
                                        <p className="product-price">{item.price.toLocaleString()} 원</p>
                                        <div className="product-meta">
                                            <span className="location">{item.location}</span>
                                            <span> · </span>
                                            <span className="product-date">
                                                {formatTimeAgo(item.createdDate)}
                                                {item.modified && (
                                                    <span style={{ marginLeft: "4px", fontSize: "0.85em", color: "#888" }}>
                                                        (수정됨)
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                </ul>
            </section>
        </div>
    );
}
