import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Slider from "react-slick";
import type { Settings } from "react-slick";
import { Clock, Hammer } from "lucide-react";
import "../css/auctionDetail.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import AuctionBidModal from "../components/AuctionBidModal";

const API_BASE = import.meta.env.VITE_API_BASE || "";

interface AuctionDetail {
    id: number;
    title: string;
    description: string;
    category: string;
    conditionType: string;
    startPrice: number;
    currentPrice: number;
    immediatePrice?: number;
    bidUnit: number;
    endDateTime: string;
    createdAt: string;
    sellerNickname: string;
    mainImageUrl?: string;
    imageUrls?: string[];
    viewCount?: number;
    bidCount?: number;
}

export default function AuctionDetail() {
    const { id } = useParams();
    const [item, setItem] = useState<AuctionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isEnded, setIsEnded] = useState(false);
    const [showBidModal, setShowBidModal] = useState(false);
    const [bidders, setBidders] = useState<
        { id: number; bidderName: string; bidPrice: number; createdAt: string }[]
    >([]);
    // ✅ 데이터 로딩
    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_BASE}/api/auctions/${id}`, { credentials: "include" });
                if (!res.ok) throw new Error("경매 상세 불러오기 실패");
                const data: AuctionDetail = await res.json();
                setItem(data);
                console.log(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "요청 실패");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);
    useEffect(() => {
        if (!id) return;

        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/auctions/${id}/bids`);
                if (res.ok) {
                    const data = await res.json();
                    setBidders(data);
                }
            } catch (e) {
                console.error("입찰자 목록 불러오기 실패:", e);
            }
        })();
    }, [id]);
    // ✅ 남은시간 계산
    useEffect(() => {
        if (!item?.endDateTime) return;

        const timer = setInterval(() => {
            const end = new Date(item.endDateTime).getTime();
            const now = Date.now();
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft("경매 종료");
                setIsEnded(true);
                clearInterval(timer);
                return;
            }

            const sec = Math.floor(diff / 1000);
            const min = Math.floor(sec / 60);
            const hr = Math.floor(min / 60);
            const day = Math.floor(hr / 24);
            const h = hr % 24;
            const m = min % 60;
            const s = sec % 60;

            if (day > 0) setTimeLeft(`${day}일 ${h}시간 ${m}분`);
            else if (hr > 0) setTimeLeft(`${h}시간 ${m}분 ${s}초`);
            else if (min > 0) setTimeLeft(`${m}분 ${s}초`);
            else setTimeLeft(`${s}초`);
        }, 1000);

        return () => clearInterval(timer);
    }, [item]);

    const handleBidConfirm = async (price: number) => {
        if (!item) return;

        try {
            const res = await fetch(`${API_BASE}/api/auctions/${item.id}/bid`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ price }),
            });

            const data = await res.json();

            if (!res.ok) {
                // 🔸 서버에서 보낸 에러 메시지 표시
                alert(data.error || "입찰 실패");
                window.location.reload(); // ✅ 최신가 새로 반영
                return;
            }

            alert("입찰이 완료되었습니다!");
            window.location.reload(); // ✅ 성공 시에도 새로고침
        } catch (err) {
            alert("입찰 중 오류가 발생했습니다.");
            console.error(err);
        }
    };

    // ✅ 즉시구매
    const handleImmediateBuy = async () => {
        if (!item?.immediatePrice) return;
        if (window.confirm("즉시 구매하시겠습니까?")) {
            try {
                const res = await fetch(`${API_BASE}/api/auctions/${item.id}/buy`, {
                    method: "POST",
                    credentials: "include",
                });
                if (!res.ok) throw new Error("즉시구매 실패");
                alert("즉시구매가 완료되었습니다!");
            } catch (err) {
                alert(err instanceof Error ? err.message : "오류 발생");
            }
        }
    };

    // ✅ 이미지 슬라이더 설정
    const sliderSettings: Settings = {
        dots: true,
        infinite: true,
        autoplay: true,
        autoplaySpeed: 3500,
        arrows: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
    };

    const images = useMemo(() => {
        if (!item) return ["/placeholder.png"];
        if (item.imageUrls && item.imageUrls.length > 0) return item.imageUrls;
        return item.mainImageUrl ? [item.mainImageUrl] : ["/placeholder.png"];
    }, [item]);

    if (loading) return <div className="auction-detail-loading">로딩 중…</div>;
    if (error) return <div className="auction-detail-error">{error}</div>;
    if (!item) return <div className="auction-detail-empty">데이터가 없습니다.</div>;

    return (
        <div className="auction-detail-container">
            {/* 브레드크럼 */}
            <nav className="auction-detail-breadcrumb">
                <Link to="/">홈</Link>
                <span>›</span>
                <Link to="/auction">경매</Link>
                <span>›</span>
                <span>{item.title}</span>
            </nav>

            <div className="auction-detail-main">
                {/* 이미지 슬라이더 */}
                <div className="auction-detail-slider">
                    <Slider {...sliderSettings}>
                        {images.map((url, idx) => (
                            <div key={idx} className="auction-detail-image-wrapper">
                                <img
                                    src={url}
                                    alt={`${item.title} ${idx + 1}`}
                                    className="auction-detail-slide-image"
                                />
                            </div>
                        ))}
                    </Slider>
                    {isEnded && <div className="auction-detail-overlay">경매 종료</div>}
                </div>

                {/* 상품 정보 */}
                <div className="auction-detail-info">
                    <h1 className="auction-detail-title">{item.title}</h1>

                    {/* 상품 상태 및 설명 */}
                    <div className="auction-detail-summary">
                        <p><strong>상품상태</strong>: {item.conditionType}</p>
                        <p><strong>상품설명</strong>: {item.description}</p>
                        <p><strong>판매자</strong>: {item.sellerNickname}</p>
                    </div>

                    <div className="auction-detail-price-box">
                        <p>시작가: {item.startPrice.toLocaleString()}원</p>
                        <p>현재가: <strong>{item.currentPrice.toLocaleString()}원</strong></p>
                        <p>입찰 단위: {item.bidUnit.toLocaleString()}원</p>
                        {item.immediatePrice && (
                            <p className="auction-detail-immediate">
                                즉시구매가: <span>{item.immediatePrice.toLocaleString()}원</span>
                            </p>
                        )}
                        <p className="auction-detail-timer">
                            <Clock size={15} style={{ color: "#007bff", marginRight: "6px", marginBottom: "-2px" }} />
                            남은 시간: {timeLeft}
                        </p>
                    </div>

                    {!isEnded && (
                        <div className="auction-detail-bid-section">
                            <button
                                className="auction-detail-bid-btn"
                                onClick={() => setShowBidModal(true)}
                            >
                                <Hammer size={16} /> 입찰하기
                            </button>
                            {item.immediatePrice && (
                                <button
                                    className="auction-detail-buy-btn"
                                    onClick={handleImmediateBuy}
                                >
                                    즉시구매
                                </button>
                            )}
                        </div>
                    )}

                    {/* 입찰 모달 */}
                    <AuctionBidModal
                        isOpen={showBidModal}
                        onClose={() => setShowBidModal(false)}
                        currentPrice={item.currentPrice}
                        bidUnit={item.bidUnit}
                        onConfirm={handleBidConfirm}
                    />
                </div>
            </div>

            {/* 🧾 입찰자 리스트 섹션 */}
            <div className="auction-bid-list">
                <h4>입찰 내역</h4>
                {bidders.length === 0 ? (
                    <p className="no-bids">아직 입찰자가 없습니다.</p>
                ) : (
                    <ul>
                        {bidders.map((b) => (
                            <li key={b.id} className="bid-item">
                                <span className="bidder">{b.bidderName}</span>
                                <span className="price">{b.bidPrice.toLocaleString()}원</span>
                                <span className="time">
                                {new Date(b.createdAt).toLocaleString("ko-KR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                })}
                            </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );

}
