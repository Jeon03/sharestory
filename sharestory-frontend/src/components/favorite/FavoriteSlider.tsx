import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../../utils/fetchWithAuth";
import "../../css/favorite.css";

interface FavoriteItem {
    id: number;
    title: string;
    price: number;
    imageUrl: string | null;
    itemStatus: string;
    favoriteCount: number;
    latitude: number;
    longitude: number;
    modified: boolean;
    createdDate?: string;
}

interface FavoriteSliderProps {
    isOpen: boolean;
    onClose: () => void;
}

// ✅ 위치 캐시
const locationCache = new Map<string, string>();
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const fetchRegionName = async (lat: number, lng: number): Promise<string> => {
    const key = `${lat},${lng}`;
    if (locationCache.has(key)) return locationCache.get(key)!;

    try {
        const res = await fetch(
            `${API_BASE}/api/map/region?lat=${lat}&lng=${lng}`,
            { credentials: "include" }
        );
        if (!res.ok) return "알 수 없음";

        const data = await res.json();
        const loc = data.documents?.[0]?.region_3depth_name || "알 수 없음";
        locationCache.set(key, loc);
        return loc;
    } catch {
        return "알 수 없음";
    }
};

export default function FavoriteSlider({ isOpen, onClose }: FavoriteSliderProps) {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [locations, setLocations] = useState<Record<number, string>>({});
    const navigate = useNavigate();

    // ✅ 관심상품 불러오기
    const fetchFavorites = async () => {
        try {
            const res = await fetchWithAuth("/api/favorites");
            const data: FavoriteItem[] = await res.json();
            setFavorites(data);
            console.log("관심상품:", data);
        } catch (err) {
            console.error("관심상품 불러오기 실패", err);
        }
    };

    // ✅ 슬라이더 열릴 때마다 관심상품 목록 가져오기
    useEffect(() => {
        if (isOpen) fetchFavorites();
    }, [isOpen]);

    // ✅ 위치 정보 불러오기
    useEffect(() => {
        const loadLocations = async () => {
            const locs: Record<number, string> = {};
            for (const item of favorites) {
                if (item.latitude && item.longitude) {
                    const region = await fetchRegionName(item.latitude, item.longitude);
                    locs[item.id] = region;
                }
            }
            setLocations(locs);
        };
        if (favorites.length > 0) loadLocations();
    }, [favorites]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    // ✅ 아이템 클릭 → 상세페이지 이동
    const handleClick = (id: number) => {
        onClose(); // 슬라이더 닫기
        navigate(`/items/${id}`);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* 오버레이 */}
            <div className="favorite-overlay" onClick={onClose}/>

            {/* 패널 */}
            <div className="favorite-panel">
                <div className="favorite-panel-header">
                    <h2>내 관심</h2>
                    <button onClick={onClose}><X/></button>
                </div>

                <div className="favorite-tab">찜한 상품</div>

                <div className="favorite-list">
                    {favorites.length === 0 ? (
                        <p className="empty-text">관심상품이 없습니다.</p>
                    ) : (
                        favorites.map((item) => (
                            <div
                                key={item.id}
                                className="favorite-card"
                                onClick={() => handleClick(item.id)}
                            >
                                <div className="favorite-thumb-wrap">
                                    <img
                                        src={item.imageUrl || "/no-image.png"}
                                        alt={item.title}
                                        className="favorite-thumb"
                                    />
                                    <span className="favorite-heart">❤️</span>
                                </div>
                                <div className="favorite-info">
                                    <div className="favorite-title">{item.title}</div>
                                    <div className="favorite-price">
                                        {item.price.toLocaleString()}원
                                    </div>
                                    <div className="favorite-meta">
                                        {locations[item.id] || "위치 불명"}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};