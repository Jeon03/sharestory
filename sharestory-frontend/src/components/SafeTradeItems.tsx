import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye, Heart, MessageCircle } from "lucide-react";
import "../css/myPage.css";
import "../css/productCard.css";
import api from "../api/axios";

interface SafeItem {
    id: number;
    title: string;
    price: number;
    imageUrl: string;
    createdDate: string;
    itemStatus:
        | "SAFE_PENDING"
        | "SAFE_READY"
        | "SAFE_START"
        | "SAFE_ING"
        | "SAFE_COMPLETE"
        | "SAFE_POINT_DONE";
    favoriteCount: number;
    viewCount: number;
    chatRoomCount: number;
    latitude?: number;
    longitude?: number;
    location?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "";

// 상대시간 포맷
const formatTimeAgo = (dateStr: string): string => {
    const created = new Date(dateStr).getTime();
    const now = Date.now();
    const diff = Math.floor((now - created) / 1000);

    if (diff < 60) return `${diff}초 전`;
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
};

// ✅ 좌표 → 행정동 변환 (캐시)
const locationCache = new Map<string, string>();
const fetchRegionName = async (lat: number, lng: number): Promise<string> => {
    const key = `${lat},${lng}`;
    if (locationCache.has(key)) return locationCache.get(key)!;

    try {
        const res = await fetch(`${API_BASE}/api/map/region?lat=${lat}&lng=${lng}`, {
            credentials: "include",
        });
        if (!res.ok) return "알 수 없음";
        const data = await res.json();
        const loc = data.documents?.[0]?.region_3depth_name || "알 수 없음";
        locationCache.set(key, loc);
        return loc;
    } catch {
        return "알 수 없음";
    }
};

export default function SafeTradeItems() {
    const [buyerItems, setBuyerItems] = useState<SafeItem[]>([]);
    const [sellerItems, setSellerItems] = useState<SafeItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSafeItems = async () => {
            try {
                const buyerRes = await api.get<SafeItem[]>("/items/safe/buyer");
                const sellerRes = await api.get<SafeItem[]>("/items/safe/seller");

                // 좌표 → 주소 변환 후 저장
                const buyerWithLocation = await Promise.all(
                    buyerRes.data.map(async (item) => {
                        let location = "위치 정보 없음";
                        if (item.latitude && item.longitude) {
                            location = await fetchRegionName(item.latitude, item.longitude);
                        }
                        return { ...item, location };
                    })
                );

                const sellerWithLocation = await Promise.all(
                    sellerRes.data.map(async (item) => {
                        let location = "위치 정보 없음";
                        if (item.latitude && item.longitude) {
                            location = await fetchRegionName(item.latitude, item.longitude);
                        }
                        return { ...item, location };
                    })
                );

                setBuyerItems(buyerWithLocation);
                setSellerItems(sellerWithLocation);
            } catch (err) {
                console.error("❌ 안전거래 불러오기 실패:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSafeItems();
    }, []);

    if (loading) return <p>불러오는 중...</p>;
    if (buyerItems.length === 0 && sellerItems.length === 0) return null;

    return (
        <section className="my-items">
            <h4>🔒 진행중인 안전거래</h4>

            {/* 내가 구매한 상품 */}
            {buyerItems.length > 0 && (
                <div>
                    <h5>내가 구매한 상품</h5>
                    <ul className="product-grid-my">
                        {buyerItems.map((item) => (
                            <li key={item.id} className="product-card">
                                <Link to={`/safe-items/${item.id}`} className="product-link">
                                    <div className="product-image-wrapper">
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="product-image"
                                            onError={(e) =>
                                                (e.currentTarget.src = "/placeholder.png")
                                            }
                                        />
                                    </div>
                                    <div className="product-info">
                                        <div className="favorite-and-views">
                                            <span className="count">
                                                <MessageCircle size={16} /> {item.chatRoomCount}
                                            </span>
                                            <span className="count">
                                                <Heart size={16} fill="#999999" color="#999999" />{" "}
                                                {item.favoriteCount}
                                            </span>
                                            <span className="count">
                                                <Eye size={16} /> {item.viewCount}
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
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* 내가 판매한 상품 */}
            {sellerItems.length > 0 && (
                <div>
                    <h5>내가 판매한 상품</h5>
                    <ul className="product-grid-my">
                        {sellerItems.map((item) => (
                            <li key={item.id} className="product-card">
                                <Link to={`/safe-items/${item.id}`} className="product-link">
                                    <div className="product-image-wrapper">
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="product-image"
                                            onError={(e) =>
                                                (e.currentTarget.src = "/placeholder.png")
                                            }
                                        />
                                    </div>
                                    <div className="product-info">
                                        <div className="favorite-and-views">
                                            <span className="count">
                                                <MessageCircle size={16} /> {item.chatRoomCount}
                                            </span>
                                            <span className="count">
                                                <Heart size={16} fill="#999999" color="#999999" />{" "}
                                                {item.favoriteCount}
                                            </span>
                                            <span className="count">
                                                <Eye size={16} /> {item.viewCount}
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
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}
