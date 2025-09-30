// src/pages/mypage/PurchasedItems.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye, Heart, MessageCircle } from "lucide-react";
import "../../css/myPage.css";
import "../../css/productCard.css";

type ItemStatus = "RESERVED" | "SOLD_OUT";

interface Item {
    id: number;
    title: string;
    price: number;
    imageUrl: string;
    createdDate: string;
    itemStatus: ItemStatus;
    favoriteCount: number;
    viewCount: number;
    chatRoomCount: number;
    latitude?: number;
    longitude?: number;
    location?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "";

const formatTimeAgo = (dateStr: string): string => {
    const created = new Date(dateStr).getTime();
    const now = Date.now();
    const diff = Math.floor((now - created) / 1000);
    if (diff < 60) return `${diff}초 전`;
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
};

// 좌표→행정동 (간단 캐시)
const locationCache = new Map<string, string>();
async function fetchRegionName(lat: number, lng: number): Promise<string> {
    const key = `${lat},${lng}`;
    if (locationCache.has(key)) return locationCache.get(key)!;
    try {
        const res = await fetch(`${API_BASE}/api/map/region?lat=${lat}&lng=${lng}`, {
            credentials: "include",
        });
        if (!res.ok) return "알 수 없음";
        const data = await res.json();
        const loc = data?.documents?.[0]?.region_3depth_name || "알 수 없음";
        locationCache.set(key, loc);
        return loc;
    } catch {
        return "알 수 없음";
    }
}

type Tab = "ALL" | "RESERVED" | "SOLD_OUT";

export default function PurchasedItems() {
    const [selectedTab, setSelectedTab] = useState<Tab>("ALL");
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/mypage/purchased`, { credentials: "include" });
                if (!res.ok) throw new Error("구매한 상품 조회 실패");
                const data: Item[] = await res.json();

                console.log("1232131221213"+data);

                // 좌표 → 행정동
                const withLoc = await Promise.all(
                    data.map(async (it) => {
                        let location = "위치 정보 없음";
                        if (it.latitude && it.longitude) {
                            location = await fetchRegionName(it.latitude, it.longitude);
                        }
                        return { ...it, location };
                    })
                );
                setItems(withLoc);
            } catch (e) {
                console.error("❌ purchased fetch error:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // 비어있으면 섹션 자체를 렌더링하지 않음
    if (loading) return null;
    if (items.length === 0) return null;

    const filtered =
        selectedTab === "ALL" ? items : items.filter((it) => it.itemStatus === selectedTab);

    return (
        <section className="purchased-items">
            <h4>🛒 내가 구매한 상품</h4>

            {/* 탭 */}
            <div className="tab-bar">
                {(["ALL", "RESERVED", "SOLD_OUT"] as const).map((tab) => (
                    <button
                        key={tab}
                        className={`tab ${selectedTab === tab ? "active" : ""}`}
                        onClick={() => setSelectedTab(tab)}
                    >
                        {{ ALL: "전체", RESERVED: "예약중", SOLD_OUT: "거래완료" }[tab]}
                    </button>
                ))}
            </div>

            <ul className="product-grid-my">
                {filtered.map((item) => (
                    <li key={item.id} className="product-card">
                        {/* 상태 뱃지 */}
                        {item.itemStatus === "RESERVED" && <div className="list-badge-reserved">예약중</div>}
                        {item.itemStatus === "SOLD_OUT" && <div className="list-badge-sold">거래완료</div>}

                        <Link to={`/items/${item.id}`} className="product-link">
                            <div className="product-image-wrapper">
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="product-image"
                                    onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                                />
                            </div>

                            <div className="product-info">
                                <div className="favorite-and-views">
                  <span className="count">
                    <MessageCircle size={16} style={{ marginRight: 4 }} /> {item.chatRoomCount}
                  </span>
                                    <span className="count">
                    <Heart size={16} fill="#999999" color="#999999" style={{ marginRight: 4 }} />{" "}
                                        {item.favoriteCount}
                  </span>
                                    <span className="count">
                    <Eye size={16} style={{ marginRight: 4 }} /> {item.viewCount}
                  </span>
                                </div>

                                <h3 className="product-title">{item.title}</h3>
                                <p className="product-price">{item.price.toLocaleString()} 원</p>

                                <div className="product-meta">
                                    <span className="location">{item.location ?? "위치 정보 없음"}</span>
                                    <span> · </span>
                                    <span className="product-date">{formatTimeAgo(item.createdDate)}</span>
                                </div>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
