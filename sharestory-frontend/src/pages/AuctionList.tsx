import { useEffect, useState } from "react";
import "../css/auctionCard.css";
import { Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface AuctionItem {
    id: number;
    title: string;
    startPrice: number;
    immediatePrice?: number;
    mainImageUrl?: string;
    createdAt: string;
    category?: string;
    endDateTime?: string;
    status?: "ONGOING" | "FINISHED" | "TRADE_PENDING" | string;
}

const API_BASE = import.meta?.env?.VITE_API_BASE || "";

// 등록 시간 → "n분 전"
const formatTimeAgo = (dateStr?: string): string => {
    if (!dateStr) return "";
    const created = new Date(dateStr).getTime();
    const diffMs = Date.now() - created;
    const sec = Math.floor(diffMs / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    if (day > 0) return `${day}일 전`;
    if (hr > 0) return `${hr}시간 전`;
    if (min > 0) return `${min}분 전`;
    return "방금 전";
};

// 남은 시간 계산
function getRemainingTime(endDateTime: string): { text: string; urgent: boolean; ended: boolean } {
    const end = new Date(endDateTime).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return { text: "경매 종료", urgent: false, ended: true };

    const sec = Math.floor(diff / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    const h = hr % 24;
    const m = min % 60;
    const s = sec % 60;
    const urgent = diff <= 10 * 60 * 1000;

    let text = "";
    if (day > 0) text = `${day}일 ${h}시간 ${m}분`;
    else if (h > 0) text = `${h}시간 ${m}분 ${s}초`;
    else if (m > 0) text = `${m}분 ${s}초`;
    else text = `${s}초 남음`;

    return { text, urgent, ended: false };
}

export default function AuctionList() {
    const [auctionItems, setAuctionItems] = useState<AuctionItem[]>([]);
    const [timeLeft, setTimeLeft] = useState<Record<number, string>>({});
    const [urgentItems, setUrgentItems] = useState<Record<number, boolean>>({});
    const [endedItems, setEndedItems] = useState<Record<number, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [timeLoading, setTimeLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/auctions/list`, {
                    credentials: "include",
                });
                if (!res.ok) throw new Error("경매상품 불러오기 실패");
                const data: AuctionItem[] = await res.json();

                const ongoing = data.filter((item) => item.status === "ONGOING");
                setAuctionItems(ongoing);

                if (ongoing.length === 0) {
                    setTimeLoading(false);
                }
            } catch (err) {
                console.error("[API] 경매상품 로드 실패:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            const newTimes: Record<number, string> = {};
            const newUrgent: Record<number, boolean> = {};
            const newEnded: Record<number, boolean> = {};

            auctionItems.forEach((item) => {
                if (item.status === "ONGOING" && item.endDateTime) {
                    const { text, urgent, ended } = getRemainingTime(item.endDateTime);
                    newTimes[item.id] = text;
                    newUrgent[item.id] = urgent;
                    newEnded[item.id] = ended;
                }
            });

            setTimeLeft(newTimes);
            setUrgentItems(newUrgent);
            setEndedItems(newEnded);

            // ✅ 첫 계산 끝났을 때 timeLoading 해제
            if (Object.keys(newTimes).length > 0 && timeLoading) {
                setTimeLoading(false);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [auctionItems]);
    // 남은 시간 실시간 갱신
    useEffect(() => {
        const timer = setInterval(() => {
            const newTimes: Record<number, string> = {};
            const newUrgent: Record<number, boolean> = {};
            const newEnded: Record<number, boolean> = {};

            auctionItems.forEach((item) => {
                if (item.status === "ONGOING" && item.endDateTime) {
                    const { text, urgent, ended } = getRemainingTime(item.endDateTime);
                    newTimes[item.id] = text;
                    newUrgent[item.id] = urgent;
                    newEnded[item.id] = ended;
                }
            });

            setTimeLeft(newTimes);
            setUrgentItems(newUrgent);
            setEndedItems(newEnded);
        }, 1000);

        return () => clearInterval(timer);
    }, [auctionItems]);

    if (loading || timeLoading) {
        return (
            <div className="auction-list-loading">
                <div className="loading-spinner" />
                <p>경매 목록을 불러오는 중입니다...</p>
            </div>
        );
    }

    const ongoingItems = auctionItems.filter(item => item.status === "ONGOING");

    return (
        <div className="auction-list container">
            <section>
                <p className="textMain">전체 경매상품</p>
                <ul className="auction-grid">
                    {auctionItems.length === 0 ? (
                        <p style={{ textAlign: "center", color: "#666", marginTop: "40px" }}>
                            현재 진행 중인 경매 상품이 없습니다.
                        </p>
                    ) : (
                        [...ongoingItems]
                            .sort((a, b) => {
                                const aEnded = endedItems[a.id];
                                const bEnded = endedItems[b.id];

                                // 1️⃣ 종료 여부 기준 — 진행 중이 먼저, 종료된 건 뒤로
                                if (aEnded !== bEnded) return aEnded ? 1 : -1;

                                // 2️⃣ 최신순 정렬 — createdAt 내림차순
                                const aTime = new Date(a.createdAt).getTime();
                                const bTime = new Date(b.createdAt).getTime();
                                return bTime - aTime;
                            })
                            .map((item) => {
                                const isEnded = endedItems[item.id];
                                return (
                                    <li
                                        key={item.id}
                                        className={`auction-card ${isEnded ? "ended" : ""}`}
                                        style={isEnded ? { pointerEvents: "none" } : {}}
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
                                                        })}
                                                        <br />
                                                        {new Date(item.endDateTime).toLocaleString("ko-KR", {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
</span>
                                                </div>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })
                    )}
                </ul>

            </section>
        </div>
    );
}
