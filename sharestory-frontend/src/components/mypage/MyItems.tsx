import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye, Heart, MessageCircle } from "lucide-react";
import "../../css/myPage.css";
import "../../css/productCard.css"; // ✅ 공통 카드 스타일

interface Item {
    id: number;
    title: string;
    price: number;
    imageUrl: string;
    createdDate: string;
    itemStatus: "ON_SALE" | "RESERVED" | "SOLD_OUT";
    favoriteCount: number;
    viewCount: number;
    chatRoomCount: number;
    latitude?: number;
    longitude?: number;
    location?: string;
    modified?: boolean;
    updatedDate?: string;
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

export default function MyItems() {
    const [selectedTab, setSelectedTab] = useState("ALL");
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyItems = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/mypage/items`, {
                    credentials: "include",
                });
                if (res.ok) {
                    const data: Item[] = await res.json();
                    const withLocation = await Promise.all(
                        data.map(async (item) => {
                            let location = "위치 정보 없음";
                            if (item.latitude && item.longitude) {
                                location = await fetchRegionName(item.latitude, item.longitude);
                            }
                            return { ...item, location };
                        })
                    );
                    setItems(withLocation);
                } else {
                    console.error("내 상품 불러오기 실패");
                }
            } catch (err) {
                console.error("API 오류:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMyItems();
    }, []);

    const filteredItems =
        selectedTab === "ALL"
            ? items
            : items.filter((item) => item.itemStatus === selectedTab);

    if (loading) return <p>불러오는 중...</p>;

    return (
        <section className="my-items">
            <h4>내 상품</h4>

            {/* 탭 메뉴 */}
            <div className="tab-bar">
                {["ALL", "ON_SALE", "RESERVED", "SOLD_OUT"].map((tab) => (
                    <button
                        key={tab}
                        className={`tab ${selectedTab === tab ? "active" : ""}`}
                        onClick={() => setSelectedTab(tab)}
                    >
                        {{
                            ALL: "전체",
                            ON_SALE: "판매중",
                            RESERVED: "예약중",
                            SOLD_OUT: "거래완료",
                        }[tab]}
                    </button>
                ))}
            </div>

            {/* 상품 카드 리스트 */}
            <ul className="product-grid-my"> {/* ✅ 공통 클래스 사용 */}
                {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                        <li key={item.id} className="product-card">
                            {/* 상태 뱃지 */}
                            {item.itemStatus === "RESERVED" && (
                                <div className="list-badge-reserved">예약중</div>
                            )}
                            {item.itemStatus === "SOLD_OUT" && (
                                <div className="list-badge-sold">거래완료</div>
                            )}

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

                            <Link to={`/items/${item.id}`} className="product-link">
                                <div className="product-info">
                                    <div className="favorite-and-views">
                                        <span className="count">
                                            <MessageCircle size={16} style={{ marginRight: 4 }} />{" "}
                                            {item.chatRoomCount}
                                        </span>
                                        <span className="count">
                                            <Heart
                                                size={16}
                                                fill="#999999"
                                                color="#999999"
                                                style={{ marginRight: 4 }}
                                            />{" "}
                                            {item.favoriteCount}
                                        </span>
                                        <span className="count">
                                            <Eye size={16} style={{ marginRight: 4 }} />{" "}
                                            {item.viewCount}
                                        </span>
                                    </div>

                                    <h3 className="product-title">{item.title}</h3>
                                    <p className="product-price">
                                        {item.price.toLocaleString()} 원
                                    </p>

                                    <div className="product-meta">
                                        <span className="location">
                                            {item.location || "위치 정보 없음"}
                                        </span>
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
                    ))
                ) : (
                    <p>등록된 상품이 없습니다.</p>
                )}
            </ul>
        </section>
    );
}
