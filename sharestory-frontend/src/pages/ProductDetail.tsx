import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { CustomArrowProps, Settings } from 'react-slick';
import Slider from 'react-slick';
import '../css/productDetail.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Heart } from "lucide-react";
import { useChatContext } from "../contexts/ChatContext";
import Select from "react-select";
import ReserveModal from "../components/ReserveModal";
import CompleteModal from "../components/CompleteModal";
import { useFavorites } from "../contexts/useFavorites";
import Toast from "../components/common/Toast";
import PurchaseSlider from "../components/PurchaseSlider";
import DeliverySlider, {type DeliveryInfo} from "../components/DeliverySlider.tsx";
import {useAuth} from "../contexts/useAuth.ts";

type ItemStatus =
    | 'ON_SALE'
    | 'RESERVED'
    | 'SOLD_OUT';


type ShippingOption = 'included' | 'separate';

interface DealInfo {
    parcel?: boolean;
    direct?: boolean;
    safeTrade?: boolean;
    shippingOption?: ShippingOption;
    phoneNumber?: string | null;
}
interface ImageDto {
    id: number;
    url: string;
}
interface ItemDetail {
    id: number;
    userId: number;
    title: string;
    price: number;
    description: string;
    category: string;
    createdDate: string;
    itemStatus: ItemStatus;
    condition: string;
    status?: string;
    imageUrl?: string;
    images?: ImageDto[];
    dealInfo?: DealInfo;
    modified?: boolean;
    updatedDate?: string;
    viewCount: number;
    chatRoomCount: number;
    latitude?: number;
    longitude?: number;
}

interface User {
    id: number;
    name: string;
    email: string;
}

const API_BASE = import.meta?.env?.VITE_API_BASE || '';

function PrevArrow({ className, style, onClick }: CustomArrowProps) {
    return <div className={className} style={{ ...style, display: 'block', left: 20, zIndex: 1 }} onClick={onClick} />;
}

function NextArrow({ className, style, onClick }: CustomArrowProps) {
    return <div className={className} style={{ ...style, display: 'block', right: 20, zIndex: 1 }} onClick={onClick} />;
}

export default function ProductDetailSimple() {
    const { id } = useParams();
    const [item, setItem] = useState<ItemDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteCount, setFavoriteCount] = useState(0);

    // 모달 상태
    const [showReserveModal, setShowReserveModal] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showPurchaseSlider, setShowPurchaseSlider] = useState(false);
    const [showDeliverySlider, setShowDeliverySlider] = useState(false);

    const navigate = useNavigate();
    const { openChat } = useChatContext();
    const { addFavorite, removeFavorite } = useFavorites();
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    const [presetMessage, setPresetMessage] = useState<string>("");


    useEffect(() => {
        if (!id) return;
        (async () => {
            const res = await fetch(`${API_BASE}/api/items/${id}`, { credentials: "include" });
            if (!res.ok) return;

            const data = await res.json();
            console.log("✅ 상세 API 응답:", data);   // ← 전체 확인
            console.log("✅ hasSafeOrder:", data.hasSafeOrder); // ← 플래그만 확인

            setItem(data);

            // 🚨 안전거래 상품인데 일반 상세로 들어왔을 경우
            if (data.hasSafeOrder && location.pathname.startsWith("/items/")) {
                navigate(`/safe-items/${id}`, { replace: true });
            }
        })();
    }, [id, navigate, location]);

    // ✅ 데이터 로딩
    useEffect(() => {
        if (!id) return;
        let aborted = false;

        (async () => {
            try {
                setLoading(true);
                setErr(null);

                // 상품 상세
                const r = await fetch(`${API_BASE}/api/items/${id}`, { credentials: 'include' });
                if (!r.ok) throw new Error(await r.text());
                const data = (await r.json()) as ItemDetail;
                if (!aborted) setItem(data);
                console.log("데이타",data);
                // 관심 여부
                const f = await fetch(`${API_BASE}/api/favorites/${id}`, { credentials: 'include' });
                if (f.ok) {
                    const fav = await f.json();
                    if (!aborted) {
                        setIsFavorite(fav.isFavorite);
                        setFavoriteCount(fav.favoriteCount ?? 0);
                    }
                }

                // 로그인 사용자 정보
                const me = await fetch(`${API_BASE}/api/main`, { credentials: 'include' });
                if (me.ok) {
                    const user = (await me.json()) as User;
                    if (!aborted) setCurrentUser(user);
                }
            } catch (e) {
                if (!aborted) setErr(e instanceof Error ? e.message : '요청 실패');
            } finally {
                if (!aborted) setLoading(false);
            }
        })();

        return () => {
            aborted = true;
        };
    }, [id]);

    // ❤️ 관심상품 토글
    const toggleFavorite = async () => {
        if (!id) return;
        try {
            const res = await fetch(`${API_BASE}/api/favorites/${id}/toggle`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();

            setIsFavorite(data.isFavorite);
            setFavoriteCount(data.favoriteCount);

            if (data.isFavorite) {
                addFavorite(Number(id));
                setToastMsg("관심상품에 등록되었습니다");
            } else {
                removeFavorite(Number(id));
                setToastMsg("관심상품이 해제되었습니다");
            }
            setTimeout(() => setToastMsg(null), 2000);
        } catch {
            alert("관심상품 처리 중 오류 발생");
        }
    };

    // 상품 삭제
    const handleDelete = async () => {
        if (!id) return;
        if (!window.confirm('정말로 이 상품을 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`${API_BASE}/api/items/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.ok) {
                alert('상품이 삭제되었습니다.');
                navigate('/');
            } else {
                alert('삭제 실패');
            }
        } catch {
            alert('삭제 중 오류 발생');
        }
    };

    // 채팅 시작
    const handleStartChat = async () => {
        if (!id || !currentUser || !item) return;

        if (currentUser.id === item.userId) {
            openChat();
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/chat/room?itemId=${id}`, {
                method: "POST",
                credentials: "include",
            });
            if (res.ok) {
                const room = await res.json();
                openChat(room.roomId);
                setPresetMessage(presetMessage || "");
            } else {
                alert("채팅방 생성 실패");
            }
        } catch (err) {
            console.error("채팅 시작 실패:", err);
        }
    };

    // 예약 확정
    const handleReserveConfirm = async (roomId: number, buyerId: number) => {
        if (!id) return;
        try {
            const res = await fetch(`${API_BASE}/api/items/${id}/reserve`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomId, buyerId }),
            });
            if (!res.ok) throw new Error("예약 실패");
            setItem({ ...item!, itemStatus: "RESERVED" });
            setShowReserveModal(false);
            alert("예약이 완료되었습니다.");
        } catch {
            alert("예약 처리 중 오류 발생");
        }
    };

    // 거래 완료 확정
    const handleCompleteConfirm = async (roomId: number, buyerId: number) => {
        if (!id) return;
        try {
            const res = await fetch(`${API_BASE}/api/items/${id}/complete`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomId, buyerId }),
            });
            if (!res.ok) throw new Error("거래완료 실패");
            setItem({ ...item!, itemStatus: "SOLD_OUT" });
            setShowCompleteModal(false);
            alert("거래가 완료되었습니다.");
        } catch {
            alert("거래완료 처리 중 오류 발생");
        }
    };

    const { refreshUser } = useAuth();

    // 배송정보 제출 → 안전거래 주문 API 호출
    const handleDeliverySubmit = async (delivery: DeliveryInfo) => {
        if (!item) return;
        try {
            const res = await fetch(`${API_BASE}/api/orders/safe`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    itemId: item.id,
                    deliveryInfo: delivery,
                }),
            });

            if (res.ok) {
                setShowDeliverySlider(false);
                await refreshUser();
                navigate(`/safe-items/${item.id}`, { replace: true });
            } else {
                alert("결제 실패");
            }
        } catch (e) {
            console.error(e);
            alert("결제 처리 중 오류 발생");
        }
    };

    const images = useMemo(() => {
        if (!item) return [];
        if (Array.isArray(item.images) && item.images.length > 0) {
            return item.images.map(img => img.url);
        }
        return item?.imageUrl ? [item.imageUrl] : [];
    }, [item]);

    const sliderSettings: Settings = {
        dots: true,
        infinite: true,
        autoplay: true,
        autoplaySpeed: 3000,
        pauseOnHover: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
        prevArrow: <PrevArrow />,
        nextArrow: <NextArrow />,
        adaptiveHeight: true,
        responsive: [{ breakpoint: 768, settings: { arrows: false, dots: true } }],
    };

    if (loading) return <div className="detail-loading">로딩 중…</div>;
    if (err) return <div className="detail-loading" style={{ color: 'crimson' }}>에러: {err}</div>;
    if (!item) return <div className="detail-loading">데이터가 없습니다.</div>;

    return (
        <div className="detail-container">
            {/* 브레드크럼 */}
            <nav className="breadcrumb">
                <Link to="/">홈</Link>
                <span>&gt;</span>
                <Link to="/category">{item.category}</Link>
                <span>&gt;</span>
                <span>{item.title}</span>
            </nav>

            <div className="detail-main">
                {/* 이미지 슬라이더 */}
                <div className="detail-slider">
                    {images.length > 0 ? (
                        <Slider {...sliderSettings}>
                            {images.map((url, idx) => (
                                <div key={idx} className="image-wrapper">
                                    <img src={url} alt={`${item.title} ${idx + 1}`} className="slide-image" />
                                </div>
                            ))}
                        </Slider>
                    ) : (
                        <div className="image-wrapper">
                            <div className="slide-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                                이미지가 없습니다
                            </div>
                        </div>
                    )}
                </div>

                {/* 상품 정보 */}
                <div className="detail-info">
                    <h1 className="detail-title">
                        {item.itemStatus === "RESERVED" && <span className="detail-status-badge detail-status-badge-reserved">예약중</span>}
                        {item.itemStatus === "SOLD_OUT" && <span className="detail-status-badge detail-status-badge-sold">판매완료</span>}
                        {item.title}
                    </h1>

                    <p className="detail-price">{item.price.toLocaleString()}원</p>

                    <div className="detail-meta">
                        <span>{new Date(item.createdDate).toLocaleDateString()}</span>
                        <span> · </span>
                        <span>조회 {item.viewCount}</span>
                        <span> · </span>
                        <span>채팅 {item.chatRoomCount}</span>
                        <span> · </span>
                        <span>찜 {favoriteCount}</span>
                    </div>

                    <div className="detail-row">
                        <span className="label">거래방법</span>
                        <span className="value">
                            {[
                                item.dealInfo?.parcel &&
                                (item.dealInfo.shippingOption === 'separate' ? '택배거래 (배송비 별도)' : '택배거래 (배송비 포함)'),
                                item.dealInfo?.direct && '직거래',
                                item.dealInfo?.safeTrade && '🔒 안전거래',
                            ].filter(Boolean).join(' · ')}
                        </span>
                    </div>

                    <div className="detail-row">
                        <span className="label">상품상태</span>
                        <span className="value">{item.condition ?? '상태 미기재'} {item.status ?? ''}</span>
                    </div>

                    <div className="detail-row description-row">
                        <span className="label">상품설명</span>
                        <div className="value">
                            {(item.description || '').split('\n').map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="action-buttons">
                        <button onClick={toggleFavorite} className="btn-fav">
                            {isFavorite ? (
                                <Heart fill="red" stroke="red" size={28} />
                            ) : (
                                <Heart stroke="black" size={28} strokeWidth={1} />
                            )}
                        </button>

                        {currentUser && item.userId === currentUser.id ? (
                            <button onClick={handleStartChat} className="btn-chat full-width">
                                채팅하기
                            </button>
                        ) : (
                            <>
                                <button onClick={handleStartChat} className="btn-chat">
                                    채팅하기
                                </button>

                                {item.itemStatus === "SOLD_OUT" ? (
                                    <button className="btn-buy disabled" disabled>
                                        판매완료
                                    </button>
                                ) : item.itemStatus === "RESERVED" ? (
                                    <button
                                        className="btn-buy reserved"
                                        onClick={handleStartChat}
                                    >
                                        예약중
                                    </button>
                                ) : (
                                    <button
                                        className="btn-buy"
                                        onClick={() => setShowPurchaseSlider(true)}
                                    >
                                        구매하기
                                    </button>
                                )}
                            </>
                        )}
                    </div>


                    {/* 판매자 전용 버튼 */}
                    {currentUser && item.userId === currentUser.id && (
                        <div className="owner-actions">
                            <div className="owner-status">
                                <span className="status-label">상품 판매상태</span>
                                <Select
                                    options={[
                                        { value: "ON_SALE", label: "판매중" },
                                        { value: "RESERVED", label: "예약중" },
                                        { value: "SOLD_OUT", label: "거래완료" },
                                    ]}
                                    value={{
                                        value: item.itemStatus,
                                        label: item.itemStatus === "ON_SALE" ? "판매중" : item.itemStatus === "RESERVED" ? "예약중" : "거래완료",
                                    }}
                                    onChange={async (selected) => {
                                        if (!selected) return;
                                        if (selected.value === "RESERVED") {
                                            setShowReserveModal(true);
                                            return;
                                        }
                                        if (selected.value === "SOLD_OUT") {
                                            setShowCompleteModal(true);
                                            return;
                                        }
                                        await fetch(`${API_BASE}/api/items/${item.id}/status?status=${selected.value}`, {
                                            method: "PATCH",
                                            credentials: "include",
                                        });
                                        setItem({ ...item, itemStatus: selected.value as ItemStatus });
                                    }}
                                    isSearchable={false}
                                />
                            </div>

                            <button className="btn-edit-link" onClick={() => navigate(`/items/${item.id}/edit`)}>✏️ 수정하기</button>
                            <button className="btn-delete" onClick={handleDelete}>🗑 삭제하기</button>
                        </div>
                    )}
                </div>
            </div>

            {showReserveModal && (
                <ReserveModal
                    itemId={item.id}
                    onClose={() => setShowReserveModal(false)}
                    onConfirm={handleReserveConfirm}
                />
            )}
            {showCompleteModal && (
                <CompleteModal
                    itemId={item.id}
                    onClose={() => setShowCompleteModal(false)}
                    onConfirm={handleCompleteConfirm}
                />
            )}
            <PurchaseSlider
                isOpen={showPurchaseSlider}
                onClose={() => setShowPurchaseSlider(false)}
                price={item.price}
                dealInfo={item.dealInfo || {}}
                latitude={item.latitude}
                longitude={item.longitude}
                onChatStart={async (presetMessage) => {
                    if (!id) return;
                    try {
                        const res = await fetch(`${API_BASE}/api/chat/room?itemId=${id}`, {
                            method: "POST",
                            credentials: "include",
                        });
                        if (!res.ok) {
                            console.error("채팅방 생성 실패", await res.text());
                            return;
                        }
                        const room = await res.json();
                        if (presetMessage) {
                            sessionStorage.setItem(`chat:preset:${room.roomId}`, presetMessage);
                        }
                        openChat(room.roomId);
                    } catch (e) {
                        console.error("채팅 시작 실패:", e);
                    }
                }}
                onPaymentStart={() => {
                    setShowPurchaseSlider(false);
                    setShowDeliverySlider(true);
                }}
            />
            <DeliverySlider
                isOpen={showDeliverySlider}
                onClose={() => setShowDeliverySlider(false)}
                price={item.price}
                shippingFee={item.dealInfo?.shippingOption === "separate" ? 3000 : 0}
                safeFee={Math.round(item.price * 0.035)}
                onSubmit={handleDeliverySubmit}
            />
            <Toast message={toastMsg} />
        </div>
    );
}
