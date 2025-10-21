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
    paymentDeadline?: string | null;
}

export default function AuctionTradeItems() {
    const [participated, setParticipated] = useState<AuctionItem[]>([]);
    const [selling, setSelling] = useState<AuctionItem[]>([]);
    const [selectedTab, setSelectedTab] = useState<"PARTICIPATED" | "SELLING">("PARTICIPATED");
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<Record<number, string>>({});
    const [urgentItems, setUrgentItems] = useState<Record<number, boolean>>({});
    const [progressMap, setProgressMap] = useState<Record<number, number>>({});

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

                // ✅ 최신순 정렬 (종료일 또는 등록일 기준)
                const sortByLatest = (a: AuctionItem, b: AuctionItem) =>
                    new Date(b.endDateTime || b.createdAt).getTime() -
                    new Date(a.endDateTime || a.createdAt).getTime();

                setParticipated(participatedData.sort(sortByLatest));
                setSelling(sellingData.sort(sortByLatest));
            } catch (err) {
                console.error("❌ 경매내역 불러오기 실패:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAuctions();
    }, []);

    // ✅ 남은시간 + 진행률 계산
    useEffect(() => {
        const updateTimes = () => {
            const allItems = [...participated, ...selling];
            const now = new Date().getTime();
            const newTimeLeft: Record<number, string> = {};
            const newUrgent: Record<number, boolean> = {};
            const newProgress: Record<number, number> = {};

            allItems.forEach((item) => {
                let targetTime = new Date(item.endDateTime).getTime();
                let totalDuration = targetTime - now;

                // ✅ FINISHED 상태에서는 결제 데드라인 기준
                if (item.status === "FINISHED" && item.paymentDeadline) {
                    const deadline = new Date(item.paymentDeadline).getTime();
                    const auctionEnd = new Date(item.endDateTime).getTime();
                    targetTime = deadline;
                    totalDuration = deadline - auctionEnd; // 5분 간격
                }

                const diff = targetTime - now;

                if (diff <= 0) {
                    newTimeLeft[item.id] =
                        item.status === "FINISHED" ? "결제시간 만료" : "종료됨";
                    newProgress[item.id] = 0;
                } else {
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                    if (item.status === "FINISHED") {
                        // ✅ 결제 마감 카운트다운 (분/초 단위)
                        newTimeLeft[item.id] = `${minutes}분 ${seconds}초 남음`;
                    } else if (days > 0) {
                        newTimeLeft[item.id] = `${days}일 ${hours}시간 남음`;
                    } else if (hours > 0) {
                        newTimeLeft[item.id] = `${hours}시간 ${minutes}분 남음`;
                    } else {
                        newTimeLeft[item.id] = `${minutes}분 남음`;
                    }

                    // 🔥 긴급 상태 (남은시간 1시간 미만)
                    newUrgent[item.id] = diff < 1000 * 60 * 60;

                    // 진행률 계산
                    const percent = Math.min(100, Math.max(0, (diff / totalDuration) * 100));
                    newProgress[item.id] = percent;
                }
            });

            setTimeLeft(newTimeLeft);
            setUrgentItems(newUrgent);
            setProgressMap(newProgress);
        };

        updateTimes();
        const timer = setInterval(updateTimes, 1000);
        return () => clearInterval(timer);
    }, [participated, selling]);

    const formatTimeAgo = (dateStr: string): string => {
        const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
        if (diff < 60) return `${Math.floor(diff)}초 전`;
        if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
        return `${Math.floor(diff / 86400)}일 전`;
    };

    if (loading)
        return (
            <div className="auction-list-loading">
                <div className="loading-spinner"></div>불러오는 중...
            </div>
        );

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
                            <li key={item.id} className={`auction-card ${isEnded ? "ended" : ""}`}>
                                <Link to={`/auction/${item.id}`}>
                                    {/* 썸네일 */}
                                    <div className="auction-thumb">
                                        <img
                                            src={item.mainImageUrl || "/placeholder.png"}
                                            alt={item.title}
                                            onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                                        />

                                        {/* 🔹 타이머 & 진행바 */}
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
                                                {item.status === "FINISHED" && item.paymentDeadline ? (
                                                    <>
                                                        <span className="deadline-label">💳 결제 마감</span>
                                                        <div className="deadline-progress-wrapper">
                                                            <div
                                                                className="deadline-progress-bar"
                                                                style={{
                                                                    width: `${progressMap[item.id] ?? 0}%`,
                                                                    background:
                                                                        progressMap[item.id] > 60
                                                                            ? "#4caf50"
                                                                            : progressMap[item.id] > 30
                                                                                ? "#ffa726"
                                                                                : "#ef5350",
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className="deadline-time-text">
                                                            {timeLeft[item.id] || "계산 중..."}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>{timeLeft[item.id] || "계산 중..."}</>
                                                )}
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

                                    {/* ✅ 종료일자 */}
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
