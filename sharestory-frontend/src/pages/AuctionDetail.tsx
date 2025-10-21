import { useEffect, useMemo, useState } from "react";
import { Link, useParams} from "react-router-dom";
import Slider from "react-slick";
import type { Settings } from "react-slick";
import { Clock, Hammer } from "lucide-react";
import "../css/auctionDetail.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import AuctionBidModal from "../components/AuctionBidModal";
import AuctionDeliverySlider from "../components/AuctionDeliverySlider";
import DeliveryModal from "../components/DeliveryModal";
import DeliveryTrackingModal from "../components/DeliveryTrackingModal";
import { useAuth } from "../contexts/useAuth";
import axios from "axios";
import type { DeliveryInfo } from "../api/delivery";
import { useNavigate } from "react-router-dom";
import AuctionPaymentTimer from "../components/AuctionPaymentTimer";

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
    sellerId: number;
    sellerNickname: string;
    winnerId?: number | null;
    mainImageUrl?: string;
    imageUrls?: string[];
    viewCount?: number;
    bidCount?: number;
    status?: string;

    seller: boolean;
    buyer: boolean;
    canViewTrade: boolean;

    paymentDeadline?: string;
    penaltyApplied?: boolean;
}

export default function AuctionDetail() {
    const { id } = useParams();
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [item, setItem] = useState<AuctionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isEnded, setIsEnded] = useState(false);
    const [showBidModal, setShowBidModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [openDeliverySlider, setOpenDeliverySlider] = useState(false);
    const [bidders, setBidders] = useState<
        { id: number; bidderName: string; bidPrice: number; createdAt: string }[]
    >([]);
    const [timeLoading, setTimeLoading] = useState(true);
    const [isExpired, setIsExpired] = useState(false);

    /** ✅ 경매 상세 불러오기 */
    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_BASE}/api/auctions/${id}`, {
                    credentials: "include",
                });
                if (!res.ok) throw new Error("경매 상세 불러오기 실패");
                const data: AuctionDetail = await res.json();
                setItem(data);
                console.log("🟢 Auction Detail Data:", data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "요청 실패");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    /** ✅ 입찰자 목록 */
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

    /** ✅ 남은시간 계산 */
    useEffect(() => {
        if (!item?.endDateTime) return;
        const timer = setInterval(() => {
            const end = new Date(item.endDateTime).getTime();
            const now = Date.now();
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft("경매 종료");
                setIsEnded(true);
                setTimeLoading(false);
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

            let formatted = "";
            if (day > 0) formatted = `${day}일 ${h}시간 ${m}분`;
            else if (hr > 0) formatted = `${h}시간 ${m}분 ${s}초`;
            else if (min > 0) formatted = `${m}분 ${s}초`;
            else formatted = `${s}초`;

            setTimeLeft(formatted);

            // ✅ 첫 계산 완료 시 로딩 해제
            if (timeLoading) setTimeLoading(false);
        }, 1000);

        return () => clearInterval(timer);
    }, [item]);


    const handleBidConfirm = async (price: number) => {
        if (!item) return;

        // ✅ 즉시구매가 존재하고, 입력한 금액이 즉시구매가 이상이면 확인창 띄우기
        if (item.immediatePrice && price >= item.immediatePrice) {
            const confirmBuyNow = window.confirm(
                `입찰 금액이 즉시구매가(${item.immediatePrice.toLocaleString()}원) 이상입니다.\n즉시구매로 진행하시겠습니까?`
            );

            if (confirmBuyNow) {
                // ✅ 즉시구매 API 호출로 전환
                try {
                    const res = await fetch(`${API_BASE}/api/auctions/${item.id}/buy`, {
                        method: "POST",
                        credentials: "include",
                    });
                    if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        alert(data.error || "즉시구매 실패");
                        return;
                    }
                    alert("즉시구매가 완료되었습니다!");
                    window.location.reload();
                } catch (err) {
                    console.error("즉시구매 오류:", err);
                    alert("즉시구매 중 오류가 발생했습니다.");
                }
                return;
            } else {
                //사용자가 취소한 경우 — 입찰 요청 중단
                alert("즉시구매가 취소되었습니다.");
                return;
            }
        }

        // ✅ 일반 입찰 로직
        try {
            const res = await fetch(`${API_BASE}/api/auctions/${item.id}/bid`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ price }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "입찰 실패");
                window.location.reload();
                return;
            }
            alert("입찰이 완료되었습니다!");
            window.location.reload();
        } catch {
            alert("입찰 중 오류가 발생했습니다.");
        }
    };

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
                window.location.reload();
            } catch {
                alert("오류 발생");
            }
        }
    };

    const images = useMemo(() => {
        if (!item) return ["/placeholder.png"];
        if (item.imageUrls && item.imageUrls.length > 0) return item.imageUrls;
        return item.mainImageUrl ? [item.mainImageUrl] : ["/placeholder.png"];
    }, [item]);

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

    if (loading || timeLoading) {
        return (
            <div className="auction-detail-loading">
                <div className="loading-spinner" />
                <p>경매 상세 정보를 불러오는 중입니다...</p>
            </div>
        );
    }
    if (error) return <div className="auction-detail-error">{error}</div>;
    if (!item) return <div className="auction-detail-empty">데이터가 없습니다.</div>;

    return (
        <div className="auction-detail-container">
            <nav className="auction-detail-breadcrumb">
                <Link to="/">홈</Link> › <Link to="/auction">경매</Link> › {item.title}
            </nav>

            <div className="auction-detail-main">
                <div className="auction-detail-slider">
                    <Slider {...sliderSettings}>
                        {images.map((url, idx) => (
                            <div key={idx} className="auction-detail-image-wrapper">
                                <img src={url} alt={`${item.title} ${idx + 1}`} className="auction-detail-slide-image" />
                            </div>
                        ))}
                    </Slider>
                </div>

                <div className="auction-detail-info">
                    <h1 className="auction-detail-title">{item.title}</h1>
                    <div className="auction-detail-summary">
                        <p><strong>상품상태</strong>: {item.conditionType}</p>
                        <p><strong>상품설명</strong>: {item.description}</p>
                        <p><strong>판매자</strong>: {item.sellerNickname}</p>
                    </div>

                    <div className="auction-detail-price-box">
                        <p>시작가: {item.startPrice?.toLocaleString() ?? 0}원</p>
                        <p>현재가: <strong>{item.currentPrice?.toLocaleString() ?? 0}원</strong></p>
                        <p>입찰 단위: {item.bidUnit?.toLocaleString() ?? 0}원</p>
                        {item.immediatePrice && (
                            <p className="auction-detail-immediate">
                                즉시구매가: <span>{item.immediatePrice.toLocaleString()}원</span>
                            </p>
                        )}
                        <p
                            className={`auction-detail-timer ${
                                isEnded
                                    ? "finished"
                                    : (() => {
                                        // 숫자만 추출해서 남은 초 계산
                                        const match = timeLeft.match(/(\d+)\s*일|(\d+)\s*시간|(\d+)\s*분|(\d+)\s*초/);
                                        if (!match) return "safe";

                                        // 대략적인 남은 분 추정
                                        const minMatch = timeLeft.match(/(\d+)\s*분/);
                                        const min = minMatch ? parseInt(minMatch[1]) : 0;
                                        const hourMatch = timeLeft.match(/(\d+)\s*시간/);
                                        const hour = hourMatch ? parseInt(hourMatch[1]) : 0;
                                        const totalMin = hour * 60 + min;

                                        if (totalMin < 1) return "danger";   // ⏰ 1분 미만
                                        if (totalMin < 5) return "warn";     // ⚠️ 5분 미만
                                        return "safe";                       // ✅ 5분 이상
                                    })()
                            }`}
                        >
                            <Clock className="timer-icon" size={15} />
                            남은 시간: {timeLeft}
                        </p>
                    </div>

                    {/* 🔹 경매 진행 중 */}
                    {!isEnded && (
                        <div className="auction-detail-bid-section">
                            <button className="auction-detail-bid-btn" onClick={() => setShowBidModal(true)}>
                                <Hammer size={16} /> 입찰하기
                            </button>
                            {item.immediatePrice && (
                                <button className="auction-detail-buy-btn" onClick={handleImmediateBuy}>
                                    즉시구매
                                </button>
                            )}
                        </div>
                    )}

                    {/* 🔹 경매 종료 후 — 거래 관련 UI */}
                    {isEnded && (
                        <>
                            {/* 🧾 판매자/구매자만 접근 가능 */}
                            {item?.canViewTrade ? (
                                <>
                                    {/* 💳 낙찰자(구매자)가 안전거래 시작 단계 */}
                                    {user && item.winnerId === user.id && item.status === "FINISHED" && (
                                        <div className="safe-detail-action">
                                            <div className="safe-detail-buyer">
                                                <div className="safe-detail-progress">
                                                    <span className="active">💳 안전거래</span>
                                                    <span>📦 송장 등록</span>
                                                    <span>🚚 배송중</span>
                                                    <span>📥 수령</span>
                                                    <span>💳 포인트 지급</span>
                                                </div>
                                                {/* ✅ 결제 제한 타이머 + 버튼 */}
                                                <div className="safe-detail-buttons">
                                                    {item.paymentDeadline && (
                                                        <AuctionPaymentTimer
                                                            deadline={item.paymentDeadline}
                                                            onExpire={() => {
                                                                setIsExpired(true);
                                                            }}
                                                        />
                                                    )}

                                                    <button
                                                        className="safe-detail-btn safe-detail-btn-green"
                                                        onClick={() => setOpenDeliverySlider(true)}
                                                        disabled={isExpired} // ✅ 비활성화 조건
                                                        style={{
                                                            opacity: isExpired ? 0.5 : 1,
                                                            cursor: isExpired ? "not-allowed" : "pointer",
                                                            transition: "opacity 0.3s ease, transform 0.2s ease",
                                                            transform: isExpired ? "none" : "scale(1)",
                                                        }}
                                                    >
                                                        🛒 안전거래 진행하기
                                                    </button>

                                                    <p
                                                        className={`safe-detail-status-banner ${
                                                            isExpired ? "red" : "yellow"
                                                        }`}
                                                    >
                                                        {isExpired
                                                            ? "⛔ 결제 가능 시간이 만료되었습니다. 경매가 취소됩니다."
                                                            : "낙찰을 축하드립니다! 배송 정보를 입력하여 안전거래를 시작하세요."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 📦 판매자 / 구매자 UI */}
                                    <div className="safe-detail-action">
                                        {item.seller ? (
                                            // ✅ 판매자 UI
                                            <div className="safe-detail-seller">
                                                {item.status === "FINISHED" && (
                                                    <>
                                                        <div className="safe-detail-buttons">
                                                            <div className="safe-detail-progress">
                                                                <span className="active">💳 결제 대기중</span>
                                                                <span>📦 송장 등록</span>
                                                                <span>🚚 배송중</span>
                                                                <span>📥 수령</span>
                                                                <span>💳 포인트 지급</span>
                                                            </div>
                                                            <p className="safe-detail-status-banner yellow">
                                                                ⏳ 경매가 종료되었습니다. 구매자가 결제할 때까지 기다려주세요.
                                                            </p>
                                                        </div>
                                                    </>
                                                )}

                                                {item.status === "TRADE_PENDING" && (
                                                    <>
                                                        <div className="safe-detail-progress">
                                                            <span className="done">💳 결제 완료</span>
                                                            <span className="active">📦 송장 등록</span>
                                                            <span>🚚 배송중</span>
                                                            <span>📥 수령</span>
                                                            <span>💳 포인트 지급</span>
                                                        </div>
                                                        <div className="safe-detail-buttons">
                                                            <button
                                                                className="safe-detail-btn safe-detail-btn-green"
                                                                onClick={() => setShowInvoiceModal(true)}
                                                            >
                                                                송장 등록하기
                                                            </button>
                                                            <p className="safe-detail-subtext">
                                                                배송정보(택배사/송장번호)를 입력하면 구매자에게 자동 안내됩니다.
                                                            </p>
                                                        </div>
                                                    </>
                                                )}

                                                {item.status === "TRADE_DELIVERY" && (
                                                    <>
                                                        <div className="safe-detail-progress">
                                                            <span className="done">💳 결제 완료</span>
                                                            <span className="done">📦 송장 등록</span>
                                                            <span className="active">🚚 배송중</span>
                                                            <span>📥 수령</span>
                                                            <span>💳 포인트 지급</span>
                                                        </div>
                                                        <div className="safe-detail-buttons">
                                                            <button
                                                                className="safe-detail-btn safe-detail-btn-blue"
                                                                onClick={() => setShowTrackingModal(true)}
                                                            >
                                                                내 배송 조회하기
                                                            </button>
                                                            <p className="safe-detail-status-banner yellow">
                                                                🚚 상품이 배송 중입니다. 구매자가 수령 확인을 하면 포인트를 받을 수 있습니다.
                                                            </p>
                                                        </div>
                                                    </>
                                                )}

                                                {item.status === "TRADE_DELIVERY_COMPLETE" && (
                                                    <>
                                                        <div className="safe-detail-progress">
                                                            <span className="done">💳 결제 완료</span>
                                                            <span className="done">📦 송장 등록</span>
                                                            <span className="done">🚚 배송중</span>
                                                            <span className="active">📥 수령 대기</span>
                                                            <span>💳 포인트 지급</span>
                                                        </div>
                                                        <div className="safe-detail-buttons">
                                                            <button
                                                                className="safe-detail-btn safe-detail-btn-blue"
                                                                onClick={() => setShowTrackingModal(true)}
                                                            >
                                                                내 배송 조회하기
                                                            </button>
                                                            <p className="safe-detail-status-banner yellow">
                                                                📦 상품 배송이 완료되었습니다. 구매자가 수령을 확인하면 포인트를 받을 수 있습니다.
                                                            </p>
                                                        </div>
                                                    </>
                                                )}

                                                {item.status === "TRADE_RECEIVED" && (
                                                    <>
                                                        <div className="safe-detail-progress">
                                                            <span className="done">💳 결제 완료</span>
                                                            <span className="done">📦 송장 등록</span>
                                                            <span className="done">🚚 배송중</span>
                                                            <span className="done">📥 수령 완료</span>
                                                            <span className="active">💳 포인트 수령</span>
                                                        </div>
                                                        <div className="safe-detail-buttons">
                                                            <button
                                                                className="safe-detail-btn safe-detail-btn-green"
                                                                onClick={async () => {
                                                                    try {
                                                                        const res = await fetch(
                                                                            `${API_BASE}/api/orders/auction/${item.id}/payout`,
                                                                            { method: "PATCH", credentials: "include" }
                                                                        );
                                                                        if (!res.ok) throw new Error("포인트 수령 실패");
                                                                        alert("✅ 포인트가 적립되었습니다.");
                                                                        setItem((prev) =>
                                                                            prev ? { ...prev, status: "TRADE_COMPLETE" } : prev
                                                                        );
                                                                        await refreshUser();
                                                                    } catch (e) {
                                                                        console.error("포인트 수령 오류:", e);
                                                                        alert("❌ 포인트 수령 중 오류 발생");
                                                                    }
                                                                }}
                                                            >
                                                                포인트 수령하기
                                                            </button>
                                                        </div>
                                                    </>
                                                )}

                                                {item.status === "TRADE_COMPLETE" && (
                                                    <>
                                                        <div className="safe-detail-progress">
                                                            <span className="done">💳 결제 완료</span>
                                                            <span className="done">📦 송장 등록</span>
                                                            <span className="done">🚚 배송중</span>
                                                            <span className="done">📥 수령 완료</span>
                                                            <span className="done">💳 포인트 지급</span>
                                                        </div>
                                                        <div className="safe-detail-buttons">
                                                            <button
                                                                className="safe-detail-btn safe-detail-btn-blue"
                                                                onClick={() => setShowTrackingModal(true)}
                                                            >
                                                                배송 조회하기
                                                            </button>
                                                            <button
                                                                className="safe-detail-btn safe-detail-btn-green"
                                                                onClick={() => navigate("/mypage/points")}
                                                            >
                                                                포인트 내역 보기
                                                            </button>
                                                        </div>
                                                        <p className="safe-detail-status-banner gray">
                                                            거래가 완료되었습니다. 포인트가 판매자에게 지급되었습니다.
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            // ✅ 구매자 UI
                                            <div className="safe-detail-buyer">
                                                {item.status === "TRADE_PENDING" && (
                                                    <>
                                                        <div className="safe-detail-progress">
                                                            <span className="done">✔ 결제 완료</span>
                                                            <span className="active">📦 송장 등록</span>
                                                            <span>🚚 배송중</span>
                                                            <span>📥 수령</span>
                                                            <span>💳 포인트 지급</span>
                                                        </div>
                                                        <p className="safe-detail-status-banner yellow">
                                                            ⏳ 아직 판매자가 송장을 등록하지 않았습니다.
                                                        </p>
                                                    </>
                                                )}

                                                {item.status === "TRADE_DELIVERY" && (
                                                    <>
                                                        <div className="safe-detail-progress">
                                                            <span className="done">✔ 결제 완료</span>
                                                            <span className="done">📦 송장 등록</span>
                                                            <span className="active">🚚 배송중</span>
                                                            <span>📥 수령</span>
                                                            <span>💳 포인트 지급</span>
                                                        </div>
                                                        <div className="safe-detail-buttons">
                                                            <button
                                                                className="safe-detail-btn safe-detail-btn-blue"
                                                                onClick={() => setShowTrackingModal(true)}
                                                            >
                                                                상품 배송 조회하기
                                                            </button>
                                                            <p className="safe-detail-status-banner yellow">
                                                                🚚 상품이 배송 중입니다. 물품을 수령하면 ‘수령 확인’을 눌러주세요.
                                                            </p>
                                                        </div>
                                                    </>
                                                )}

                                                {item.status === "TRADE_DELIVERY_COMPLETE" && (
                                                    <>
                                                        <div className="safe-detail-progress">
                                                            <span className="done">✔ 결제 완료</span>
                                                            <span className="done">📦 송장 등록</span>
                                                            <span className="done">🚚 배송중</span>
                                                            <span className="active">📥 수령</span>
                                                            <span>💳 포인트 지급</span>
                                                        </div>
                                                        <div className="safe-detail-buttons">
                                                            <button
                                                                className="safe-detail-btn safe-detail-btn-blue"
                                                                onClick={() => setShowTrackingModal(true)}
                                                            >
                                                                배송 조회하기
                                                            </button>
                                                            <button
                                                                className="safe-detail-btn safe-detail-btn-green"
                                                                onClick={async () => {
                                                                    try {
                                                                        const res = await fetch(
                                                                            `${API_BASE}/api/orders/auction/${item.id}/confirm-receipt`,
                                                                            { method: "PATCH", credentials: "include" }
                                                                        );
                                                                        if (!res.ok) throw new Error("수령 확인 실패");
                                                                        alert("✅ 수령이 확인되었습니다. 판매자가 포인트를 수령하면 거래가 완료됩니다.");
                                                                        setItem((prev) =>
                                                                            prev ? { ...prev, status: "TRADE_RECEIVED" } : prev
                                                                        );
                                                                    } catch {
                                                                        alert("❌ 수령 확인 중 오류 발생");
                                                                    }
                                                                }}
                                                            >
                                                                물품 수령 확인
                                                            </button>
                                                        </div>
                                                    </>
                                                )}

                                                {item.status === "TRADE_RECEIVED" && (
                                                    <>
                                                        <div className="safe-detail-progress">
                                                            <span className="done">✔ 결제 완료</span>
                                                            <span className="done">📦 송장 등록</span>
                                                            <span className="done">🚚 배송중</span>
                                                            <span className="done">📥 수령 완료</span>
                                                            <span className="active">💳 포인트 수령 대기</span>
                                                        </div>
                                                        <div className="safe-detail-buttons">
                                                            <button
                                                                className="safe-detail-btn safe-detail-btn-blue"
                                                                onClick={() => setShowTrackingModal(true)}
                                                            >
                                                                상품 배송 조회하기
                                                            </button>
                                                            <p className="safe-detail-status-banner yellow">
                                                                💰 판매자가 포인트 수령 대기 중입니다.
                                                            </p>
                                                        </div>
                                                    </>
                                                )}

                                                {item.status === "TRADE_COMPLETE" && (
                                                    <>
                                                        <div className="safe-detail-progress">
                                                            <span className="done">✔ 결제 완료</span>
                                                            <span className="done">📦 송장 등록</span>
                                                            <span className="done">🚚 배송중</span>
                                                            <span className="done">📥 수령 완료</span>
                                                            <span className="done">💳 포인트 지급 완료</span>
                                                        </div>
                                                        <div className="safe-detail-buttons">
                                                            <button
                                                                className="safe-detail-btn safe-detail-btn-blue"
                                                                onClick={() => setShowTrackingModal(true)}
                                                            >
                                                                배송 조회하기
                                                            </button>
                                                            <button
                                                                className="safe-detail-btn safe-detail-btn-green"
                                                                onClick={() => navigate("/mypage/points")}
                                                            >
                                                                포인트 내역 보기
                                                            </button>
                                                        </div>
                                                        <p className="safe-detail-status-banner gray">
                                                            거래가 완료되었습니다. 포인트 정산이 완료되었습니다.
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                // 🚫 제3자 접근 차단
                                <div className="auction-ended-banner">
                                    <p>⚠️ 경매가 종료되었습니다. 거래 정보는 판매자와 낙찰자만 확인할 수 있습니다.</p>
                                </div>
                            )}
                            {/* ❌ 경매가 취소된 경우 */}
                            {item.status === "CANCELLED" && (
                                <div className="safe-detail-action">
                                    <div className="safe-detail-buyer">
                                        <div className="safe-detail-progress">
                                            <span>💳 안전거래</span>
                                            <span>📦 송장 등록</span>
                                            <span>🚚 배송중</span>
                                            <span>📥 수령</span>
                                            <span>💳 포인트 지급</span>
                                        </div>

                                        <div className="safe-detail-buttons">
                                            <p className="safe-detail-status-banner red">
                                                {user && item.sellerId === user.id
                                                    ? "❌ 낙찰자가 결제하지 않아 경매가 자동 취소되었습니다."
                                                    : user && item.winnerId === user.id
                                                        ? "⚠️ 결제 가능 시간이 초과되어 경매가 취소되었습니다."
                                                        : "❌ 이 경매는 취소되어 거래가 종료되었습니다."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>

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

            {/* 🧾 입찰 내역 */}
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

            {/* ✅ 송장등록 모달 */}
            {showInvoiceModal && item && (
                <DeliveryModal
                    itemId={item.id}
                    isAuction={true}
                    onClose={() => setShowInvoiceModal(false)}
                    onSuccess={() => {
                        alert("송장 등록 완료!");
                        setShowInvoiceModal(false);
                        window.location.reload();
                    }}
                />
            )}

            {/* ✅ 배송조회 모달 */}
            <DeliveryTrackingModal
                itemId={item?.id || 0}
                isOpen={showTrackingModal}
                onClose={() => setShowTrackingModal(false)}
                isAuction={true}
            />

            {/* ✅ 구매자용 배송정보 입력 슬라이더 */}
            {openDeliverySlider && item && (
                <AuctionDeliverySlider
                    isOpen={openDeliverySlider}
                    onClose={() => setOpenDeliverySlider(false)}
                    price={item.currentPrice}
                    shippingFee={3000}
                    safeFee={Math.round(item.currentPrice * 0.035)}
                    onSubmit={async (delivery: DeliveryInfo) => {
                        try {
                            await axios.put(
                                `${API_BASE}/api/orders/auction/${item.id}/delivery`,
                                delivery,
                                { withCredentials: true }
                            );
                            alert("배송 정보가 등록되었습니다!");
                            window.location.reload();
                        } catch {
                            alert("배송정보 등록 실패");
                        }
                    }}
                />
            )}
        </div>
    );
}