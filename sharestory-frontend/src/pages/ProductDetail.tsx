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

type ItemStatus =
    | 'ON_SALE'
    | 'RESERVED'
    | 'SOLD_OUT'
    | 'SAFE_DELIVERY'
    | 'SAFE_DELIVERY_START'
    | 'SAFE_DELIVERY_ING'
    | 'SAFE_DELIVERY_COMPLETE'
    | 'SAFE_DELIVERY_POINT_DONE';

type ShippingOption = 'included' | 'separate';

interface DealInfo {
    parcel?: boolean;
    direct?: boolean;
    safeTrade?: boolean;
    shippingOption?: ShippingOption;
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

    // ✅ 예약 모달 상태
    const [showReserveModal, setShowReserveModal] = useState(false);

    const navigate = useNavigate();
    const { openChat } = useChatContext();

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
                method: 'POST',
                credentials: 'include',
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setIsFavorite(data.isFavorite);
            setFavoriteCount(data.favoriteCount);
        } catch {
            alert('관심상품 처리 중 오류 발생');
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
            } else {
                alert("채팅방 생성 실패");
            }
        } catch (err) {
            console.error("채팅 시작 실패:", err);
        }
    };

    // ✅ 예약 확정
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
                            {isFavorite ? <Heart fill="red" stroke="red" size={28} /> : <Heart stroke="black" size={28} strokeWidth={1} />}
                        </button>
                        <button onClick={handleStartChat} className="btn-chat">채팅하기</button>
                        <button className="btn-buy">구매하기</button>
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
                                        await fetch(`${API_BASE}/api/items/${item.id}/status?status=${selected.value}`, {
                                            method: "PATCH",
                                            credentials: "include",
                                        });
                                        setItem({ ...item, itemStatus: selected.value as ItemStatus });
                                    }}
                                    isSearchable={false}
                                    styles={{
                                        control: (provided, state) => ({
                                            ...provided,
                                            borderRadius: "8px",
                                            borderColor: state.isFocused ? "gold" : "#ddd", // 포커스 시 오렌지
                                            boxShadow: state.isFocused ? "0 0 0 2px rgba(255,126,54,0.2)" : "none",
                                            "&:hover": { borderColor: "gold" },
                                            minHeight: "40px",
                                        }),
                                        option: (provided, state) => ({
                                            ...provided,
                                            backgroundColor: state.isSelected
                                                ? "#f5e166"
                                                : state.isFocused
                                                    ? ""
                                                    : "#fff",
                                            color: state.isSelected ? "black" : "#333",
                                            padding: "10px 12px",
                                            cursor: "pointer",
                                        }),
                                        singleValue: (provided) => ({
                                            ...provided,
                                            color: "#333",
                                            fontWeight: 500,
                                        }),
                                        dropdownIndicator: (provided) => ({
                                            ...provided,
                                            color: "gray",
                                            "&:hover": { color: "black" },
                                        }),
                                    }}
                                />
                            </div>

                            <button className="btn-edit-link" onClick={() => navigate(`/items/${item.id}/edit`)}>✏️ 수정하기</button>
                            <button className="btn-delete" onClick={handleDelete}>🗑 삭제하기</button>
                        </div>
                    )}
                </div>
            </div>

            {/* ✅ 예약자 선택 모달 */}
            {showReserveModal && (
                <ReserveModal
                    itemId={item.id}
                    onClose={() => setShowReserveModal(false)}
                    onConfirm={handleReserveConfirm}
                />
            )}
        </div>
    );
}
