import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import "../../css/auctionCard.css";
import "../../css/myPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface AuctionItem {
    id: number;
    title: string;
    category: string;
    startPrice: number;
    immediatePrice?: number | null;
    mainImageUrl: string;
    createdAt: string;
    endDateTime: string;
    status: string;
}

export default function AuctionTradeItems() {
    const [participated, setParticipated] = useState<AuctionItem[]>([]);
    const [selling, setSelling] = useState<AuctionItem[]>([]);
    const [selectedTab, setSelectedTab] = useState<"PARTICIPATED" | "SELLING">("PARTICIPATED");
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<Record<number, string>>({});
    const [urgentItems, setUrgentItems] = useState<Record<number, boolean>>({});

    const fetchData = async (url: string) => {
        const res = await fetch(`${API_BASE}${url}`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    };

    useEffect(() => {
        const fetchAuctions = async () => {
            try {
                const [participatedData, sellingData] = await Promise.all([
                    fetchData("/auction/my-auctions"),
                    fetchData("/auction/my-sellings"),
                ]);
                setParticipated(participatedData);
                setSelling(sellingData);
            } catch (err) {
                console.error("❌ 경매내역 불러오기 실패:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAuctions();
    }, []);

// ✅ 남은시간 계산 (일/시간/분 단위)
    useEffect(() => {
        const updateTimes = () => {
            const allItems = [...participated, ...selling];
            const now = new Date().getTime();
            const newTimeLeft: Record<number, string> = {};
            const newUrgent: Record<number, boolean> = {};

            allItems.forEach((item) => {
                const end = new Date(item.endDateTime).getTime();
                const diff = end - now;

                if (diff <= 0) {
                    newTimeLeft[item.id] = "종료됨";
                } else {
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                    if (days > 0) {
                        newTimeLeft[item.id] = `${days}일 ${hours}시간 남음`;
                    } else if (hours > 0) {
                        newTimeLeft[item.id] = `${hours}시간 ${minutes}분 남음`;
                    } else {
                        newTimeLeft[item.id] = `${minutes}분 남음`;
                    }

                    // 🔥 긴급 상태 (남은시간 1시간 미만)
                    newUrgent[item.id] = diff < 1000 * 60 * 60;
                }
            });

            setTimeLeft(newTimeLeft);
            setUrgentItems(newUrgent);
        };

        updateTimes();
        const timer = setInterval(updateTimes, 60 * 1000);
        return () => clearInterval(timer);
    }, [participated, selling]);

    const formatTimeAgo = (dateStr: string): string => {
        const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
        if (diff < 60) return `${Math.floor(diff)}초 전`;
        if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
        return `${Math.floor(diff / 86400)}일 전`;
    };

    if (loading) return <div className="auction-list-loading"><div className="loading-spinner"></div>불러오는 중...</div>;

    const currentList = selectedTab === "PARTICIPATED" ? participated : selling;

    return (
        <section>
            <h4>경매내역</h4>

            {/* 🧭 탭 메뉴 */}
            <div className="tab-bar">
                <button
                    className={`tab ${selectedTab === "PARTICIPATED" ? "active" : ""}`}
                    onClick={() => setSelectedTab("PARTICIPATED")}
                >
                    참여한 경매
                </button>
                <button
                    className={`tab ${selectedTab === "SELLING" ? "active" : ""}`}
                    onClick={() => setSelectedTab("SELLING")}
                >
                    등록한 경매
                </button>
            </div>

            {currentList.length === 0 ? (
                <p>데이터가 없습니다.</p>
            ) : (
                <ul className="auction-grid2">
                    {currentList.map((item) => {
                        const endTime = new Date(item.endDateTime).getTime();
                        const isEnded = Date.now() > endTime;

                        return (
                            <li
                                key={item.id}
                                className={`auction-card ${isEnded ? "ended" : ""}`}
                            >
                                <Link to={`/auction/${item.id}`}>
                                    {/* 썸네일 */}
                                    <div className="auction-thumb">
                                        <img
                                            src={item.mainImageUrl || "/placeholder.png"}
                                            alt={item.title}
                                            onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                                        />

                                        {/* 남은시간 or 종료 */}
                                        {item.endDateTime && (
                                            <div
                                                className={`auction-time-badge ${
                                                    isEnded
                                                        ? "ended"
                                                        : urgentItems[item.id]
                                                            ? "urgent"
                                                            : ""
                                                }`}
                                            >
                                                {timeLeft[item.id] || "계산 중..."}
                                            </div>
                                        )}

                                        {/* 오버레이 (종료 시) */}
                                        {isEnded && (
                                            <div className="auction-overlay">
                                                <span>경매 종료</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* 본문 */}
                                    <div className="auction-info">
                                        <h3 className="auction-title">{item.title}</h3>

                                        <p className="auction-price-line">
                                            시작가 {item.startPrice.toLocaleString()}원
                                        </p>
                                        {item.immediatePrice && (
                                            <p className="auction-price-line buy-now">
                                                즉시구매 {item.immediatePrice.toLocaleString()}원
                                            </p>
                                        )}
                                        <div className="auction-meta">
                                            {item.category && <span>{item.category}</span>}
                                            <span>·</span>
                                            <span>{formatTimeAgo(item.createdAt)}</span>
                                        </div>
                                    </div>

                                    {/* ✅ 카드 하단 종료일자 */}
                                    {item.endDateTime && (
                                        <div
                                            className={`auction-end-date ${
                                                isEnded ? "ended-date" : ""
                                            }`}
                                        >
                                            <Clock size={14} />
                                            <span>
                        종료일자:{" "}
                                                {new Date(item.endDateTime).toLocaleString("ko-KR", {
                                                    year: "numeric",
                                                    month: "2-digit",
                                                    day: "2-digit",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                      </span>
                                        </div>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
