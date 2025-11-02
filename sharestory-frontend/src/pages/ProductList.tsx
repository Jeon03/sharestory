import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Heart, MessageCircle } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import BannerSlider from "../components/BannerSlider.tsx";

// CSS
import "../css/list.css";
import "../css/productCard.css";
// @ts-expect-error Swiper CSS declarations
import "swiper/css";
// @ts-expect-error Swiper CSS declarations
import "swiper/css/navigation";
// @ts-expect-error Swiper CSS declarations
import "swiper/css/pagination";

/* ===============================
   인터페이스 정의
   =============================== */
interface DealInfo {
    parcel?: boolean;
    direct?: boolean;
    safeTrade?: boolean;
    shippingOption?: "included" | "separate";
    phoneNumber?: string | null;
}

interface ProductItem {
    id: number;
    title: string;
    price: number;
    imageUrl: string;
    createdDate: string;
    itemStatus: "ON_SALE" | "RESERVED" | "SOLD_OUT" | string;
    status?: "ON_SALE" | "RESERVED" | "SOLD_OUT";
    favoriteCount: number;
    viewCount: number;
    chatRoomCount: number;
    dealInfo?: DealInfo;
    latitude?: number;
    longitude?: number;
    location?: string;
    modified?: boolean;
    updatedDate?: string;
}

const API_BASE = import.meta?.env?.VITE_API_BASE || "";

/* ===============================
   상대시간 포맷 함수
   =============================== */
const formatTimeAgo = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "";
    const created = new Date(dateStr).getTime();
    if (Number.isNaN(created)) return "";

    const now = Date.now();
    const diffMs = Math.max(0, now - created);

    const sec = Math.floor(diffMs / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);

    if (day > 0) return `${day}일 전`;
    if (hr > 0) return `${hr}시간 전`;
    if (min > 0) return `${min}분 전`;
    return "방금 전";
};

/* ===============================
   좌표 → 지역명 변환 (캐시 사용)
   =============================== */
const locationCache = new Map<string, string>();

const fetchRegionName = async (lat: number, lng: number): Promise<string> => {
    const key = `${lat},${lng}`;
    if (locationCache.has(key)) return locationCache.get(key)!;

    const res = await fetch(`${API_BASE}/api/map/region?lat=${lat}&lng=${lng}`, {
        credentials: "include",
    });
    if (!res.ok) return "알 수 없음";

    const data = await res.json();
    const loc = data.documents?.[0]?.region_3depth_name || "알 수 없음";
    locationCache.set(key, loc);
    return loc;
};

/* ===============================
   공통 fetch 함수
   =============================== */
const fetchItems = async (url: string): Promise<ProductItem[]> => {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(`${url} 실패`);

    const data: ProductItem[] = await res.json();

    return await Promise.all(
        data.map(async (item) => {
            let location = "알 수 없음";
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

/* ===============================
   메인 컴포넌트
   =============================== */
export default function ProductList() {
    const [latestItems, setLatestItems] = useState<ProductItem[]>([]);
    const [favorites, setFavorites] = useState<ProductItem[]>([]);
    const [views, setViews] = useState<ProductItem[]>([]);
    const [allItems, setAllItems] = useState<ProductItem[]>([]);
    const [loading, setLoading] = useState(true);

    /* ✅ 데이터 로드 */
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
                console.error("[API] 상품 로드 실패:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* ✅ Swiper 카드 렌더링 */
    const renderSwiper = (items: ProductItem[]) => (
        <Swiper
            modules={[Navigation, Pagination]}
            navigation
            spaceBetween={20}
            slidesPerView={5}
            pagination={{ clickable: true }}
            className="swiper-product-container"
            breakpoints={{
                1200: { slidesPerView: 5 },
                992: { slidesPerView: 4 },
                768: { slidesPerView: 3 },
                480: { slidesPerView: 2 },
                0: { slidesPerView: 1 },
            }}
        >
            {items.map((item) => (
                <SwiperSlide key={item.id}>
                    <li className="swiper-product-card">
                        <Link to={`/items/${item.id}`} className="swiper-product-link">
                            <div className="swiper-product-image-wrapper">
                                {item.itemStatus === "RESERVED" && (
                                    <div className="swiper-list-badge-reserved">예약중</div>
                                )}
                                {item.dealInfo?.safeTrade && (
                                    <div className="swiper-list-badge-safe">안전거래</div>
                                )}
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="swiper-product-image"
                                    onError={(e) => {
                                        e.currentTarget.src = "/placeholder.png";
                                    }}
                                />
                            </div>

                            <div className="swiper-product-info">
                                <div className="swiper-favorite-and-views">
                  <span className="swiper-count">
                    <MessageCircle size={16} style={{ marginRight: 4 }} />
                      {item.chatRoomCount}
                  </span>
                                    <span className="swiper-count">
                    <Heart
                        size={16}
                        fill="#999999"
                        color="#999999"
                        style={{ marginRight: 4 }}
                    />
                                        {item.favoriteCount}
                  </span>
                                    <span className="swiper-count">
                    <Eye size={16} style={{ marginRight: 4 }} />
                                        {item.viewCount}
                  </span>
                                </div>

                                <h3 className="swiper-product-title">{item.title}</h3>
                                <p className="swiper-product-price">
                                    {item.price.toLocaleString()}원
                                </p>

                                <div className="swiper-product-meta">
                                    <span className="swiper-location">{item.location}</span>
                                    <span> · </span>
                                    <span className="swiper-product-date">
                    {formatTimeAgo(item.createdDate)}
                                        {item.modified && (
                                            <span
                                                style={{
                                                    marginLeft: "4px",
                                                    fontSize: "0.85em",
                                                    color: "#888",
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
                </SwiperSlide>
            ))}
        </Swiper>
    );

    if (loading) return <div className="product-list">로딩 중...</div>;

    /* ✅ 메인 렌더링 */
    return (
        <div className="product-list container">
            <BannerSlider />

            {/* 최신 등록 상품 */}
            <section>
                <p className="textMain">최신 등록 상품</p>
                {renderSwiper(
                    latestItems.filter(
                        (i) => i.itemStatus === "ON_SALE" || i.itemStatus === "RESERVED"
                    )
                )}
            </section>

            <br />
            <br />
            <br />

            {/* 관심 많은 상품 */}
            <section>
                <p className="textMain">관심이 많은 상품</p>
                {renderSwiper(
                    favorites.filter(
                        (i) => i.itemStatus === "ON_SALE" || i.itemStatus === "RESERVED"
                    )
                )}
            </section>

            <br />
            <br />
            <br />

            {/* 많이 본 상품 */}
            <section>
                <p className="textMain">많이 본 상품</p>
                {renderSwiper(
                    views.filter(
                        (i) => i.itemStatus === "ON_SALE" || i.itemStatus === "RESERVED"
                    )
                )}
            </section>

            <br />
            <br />
            <br />

            {/* 전체 상품 */}
            <section>
                <p className="textMain">전체 상품</p>
                <ul className="product-grid">
                    {allItems
                        .filter(
                            (i) => i.itemStatus === "ON_SALE" || i.itemStatus === "RESERVED"
                        )
                        .map((item) => (
                            <li key={item.id} className="product-card">
                                <Link to={`/items/${item.id}`} className="product-link">
                                    <div className="image-wrapper">
                                        {item.itemStatus === "RESERVED" && (
                                            <div className="list-badge-reserved">예약중</div>
                                        )}
                                        {item.dealInfo?.safeTrade && (
                                            <div className="list-badge-safe">안전거래</div>
                                        )}
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="product-image"
                                            onError={(e) => {
                                                e.currentTarget.src = "/placeholder.png";
                                            }}
                                        />
                                    </div>

                                    <div className="product-info">
                                        <div className="favorite-and-views">
                      <span className="count">
                        <MessageCircle size={16} style={{ marginRight: 4 }} />
                          {item.chatRoomCount}
                      </span>
                                            <span className="count">
                        <Heart
                            size={16}
                            fill="#999999"
                            color="#999999"
                            style={{ marginRight: 4 }}
                        />
                                                {item.favoriteCount}
                      </span>
                                            <span className="count">
                        <Eye size={16} style={{ marginRight: 4 }} />
                                                {item.viewCount}
                      </span>
                                        </div>

                                        <h3 className="product-title">{item.title}</h3>
                                        <p className="product-price">
                                            {item.price.toLocaleString()} 원
                                        </p>

                                        <div className="product-meta">
                                            <span className="location">{item.location}</span>
                                            <span> · </span>
                                            <span className="product-date">
                        {formatTimeAgo(item.createdDate)}
                                                {item.modified && (
                                                    <span
                                                        style={{
                                                            marginLeft: "4px",
                                                            fontSize: "0.85em",
                                                            color: "#888",
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
                        ))}
                </ul>
            </section>
        </div>
    );
}
