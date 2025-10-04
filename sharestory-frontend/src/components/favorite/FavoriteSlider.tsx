import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../../utils/fetchWithAuth";
import { AnimatePresence, motion } from "framer-motion";
import "../../css/favorite.css";
import { useFavorites } from "../../contexts/useFavorites";
import { Heart } from "lucide-react";
import Toast from "../common/Toast";

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

const locationCache = new Map<string, string>();
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

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

export default function FavoriteSlider({ isOpen, onClose }: FavoriteSliderProps) {
    const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);
    const [locations, setLocations] = useState<Record<number, string>>({});
    const navigate = useNavigate();

    const { setFavorites, removeFavorite } = useFavorites();
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    // ✅ 관심상품 불러오기
    useEffect(() => {
        if (isOpen) {
            fetchWithAuth("/api/favorites")
                .then((res) => res.json())
                .then((data: FavoriteItem[]) => {
                    setFavoriteItems(data);
                    setFavorites(data.map((i) => i.id)); // Context에도 업데이트
                })
                .catch((err) => console.error("관심상품 불러오기 실패", err));
        }
    }, [isOpen, setFavorites]);

    // ✅ 위치 정보 불러오기
    useEffect(() => {
        const loadLocations = async () => {
            const locs: Record<number, string> = {};
            for (const item of favoriteItems) {
                if (item.latitude && item.longitude) {
                    const region = await fetchRegionName(item.latitude, item.longitude);
                    locs[item.id] = region;
                }
            }
            setLocations(locs);
        };
        if (favoriteItems.length > 0) loadLocations();
    }, [favoriteItems]);

    // ✅ ESC 닫기
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    // ✅ 상세페이지 이동
    const handleClick = (id: number) => {
        onClose();
        navigate(`/items/${id}`);
    };

    // ✅ 찜 해제
    const handleRemove = async (id: number) => {
        try {
            const res = await fetch(`${API_BASE}/api/favorites/${id}/toggle`, {
                method: "POST",
                credentials: "include",
            });
            if (res.ok) {
                setFavoriteItems((prev) => prev.filter((item) => item.id !== id));
                removeFavorite(id); // Context에서도 제거

                setToastMsg("관심상품이 해제되었습니다");
                setTimeout(() => setToastMsg(null), 2000);
            }
        } catch {
            alert("찜 해제 실패");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 오버레이 */}
                    <motion.div
                        className="favorite-overlay"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    />

                    {/* 패널 */}
                    <motion.div
                        className="favorite-panel"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "tween", duration: 0.3 }}
                    >
                        <div className="favorite-panel-header">
                            <h2>나의 관심상품</h2>
                            <button onClick={onClose}>❌</button>
                        </div>

                        <div className="favorite-list">
                            {favoriteItems.length === 0 ? (
                                <p className="empty-text">관심상품이 없습니다.</p>
                            ) : (
                                favoriteItems.map((item) => (
                                    <div key={item.id} className="favorite-card">
                                        <div
                                            className="favorite-thumb-wrap"
                                            onClick={() => handleClick(item.id)}
                                        >
                                            <img
                                                src={item.imageUrl || "/no-image.png"}
                                                alt={item.title}
                                                className="favorite-thumb"
                                            />
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
                                        {/* 해제 버튼 */}
                                        <button
                                            className="favorite-remove-btn"
                                            onClick={() => handleRemove(item.id)}
                                        >
                                            <Heart fill="red" stroke="red" size={30} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                    <Toast message={toastMsg} />
                </>
            )}
        </AnimatePresence>
    );
}
