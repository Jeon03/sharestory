import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import api from "../api/axios";
import { Eye, Heart, MessageCircle } from "lucide-react";
import "../css/list.css";
import type { ItemSummary } from "../types/item";

const API_BASE = import.meta?.env?.VITE_API_BASE || "";

// 상대시간 포맷
const formatTimeAgo = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "";
    const created = new Date(dateStr).getTime();
    if (Number.isNaN(created)) return "";
    const now = Date.now();
    const diffMs = Math.max(0, now - created);

    const min = Math.floor(diffMs / 60000);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);

    if (day > 0) return `${day}일 전`;
    if (hr > 0) return `${hr}시간 전`;
    if (min > 0) return `${min}분 전`;
    return "방금 전";
};

// ✅ 좌표 → 행정동 이름 변환 (캐싱 포함)
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

export default function SearchPage() {
    const { search } = useLocation();
    const params = new URLSearchParams(search);
    const keyword = params.get("keyword") || "";
    const lat = params.get("lat");
    const lon = params.get("lon");
    const distance = params.get("distance") || "3km";

    const [items, setItems] = useState<ItemSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchItems() {
            try {
                const response = await api.get<ItemSummary[]>("/items/search", {
                    params: { keyword, lat, lon, distance },
                });

                const mapped = await Promise.all(
                    (response.data || []).map(async (item) => {
                        let location = "알 수 없음";
                        if (item.latitude && item.longitude) {
                            try {
                                location = await fetchRegionName(item.latitude, item.longitude);
                            } catch {
                                location = "알 수 없음";
                            }
                        }
                        return { ...item, location };
                    })
                );

                setItems(mapped);
            } catch (err) {
                console.error("검색 실패", err);
            } finally {
                setLoading(false);
            }
        }
        fetchItems();
    }, [keyword, lat, lon, distance]);

    if (loading) return <div className="product-list">로딩 중...</div>;
    if (!items.length) return <div className="product-list">검색 결과가 없습니다.</div>;

    return (
        <div className="product-list container">
            <h1 className="textMain">
                {keyword ? `"${keyword}" 검색 결과` : "검색 결과"}
            </h1>

            <ul className="grid">
                {items
                    .filter((i) => i.itemStatus === "ON_SALE" || i.itemStatus === "RESERVED")
                    .map((item) => (
                        <li key={item.id} className="product-card">
                            {item.itemStatus === "RESERVED" && (
                                <div className="list-badge-reserved">예약중</div>
                            )}
                            <div className="image-wrapper">
                                <img
                                    src={item.imageUrl || "/placeholder.png"}
                                    alt={item.title}
                                    className="product-image"
                                    onError={(e) => {
                                        e.currentTarget.src = "/placeholder.png";
                                    }}
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
                                    <p className="product-price">{item.price?.toLocaleString()} 원</p>
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
        </div>
    );
}
