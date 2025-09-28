import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { CustomArrowProps, Settings } from 'react-slick';
import Slider from 'react-slick';
import '../css/safeProductDetail.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

type ItemStatus =
    | 'SAFE_PENDING'
    | 'SAFE_READY'
    | 'SAFE_START'
    | 'SAFE_ING'
    | 'SAFE_COMPLETE'
    | 'SAFE_POINT_DONE';

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

export default function SafeProductDetail() {
    const { id } = useParams();
    const [item, setItem] = useState<ItemDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [favoriteCount, setFavoriteCount] = useState(0);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // ✅ 데이터 로딩
    useEffect(() => {
        if (!id) return;
        let aborted = false;

        (async () => {
            try {
                setLoading(true);
                setErr(null);

                const r = await fetch(`${API_BASE}/api/items/${id}`, { credentials: 'include' });
                if (!r.ok) throw new Error(await r.text());
                const data = (await r.json()) as ItemDetail;
                if (!aborted) setItem(data);

                const f = await fetch(`${API_BASE}/api/favorites/${id}`, { credentials: 'include' });
                if (f.ok) {
                    const fav = await f.json();
                    if (!aborted) {
                        setFavoriteCount(fav.favoriteCount ?? 0);
                    }
                }

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

    if (loading) return <div className="safe-detail-loading">로딩 중…</div>;
    if (err) return <div className="safe-detail-loading" style={{ color: 'crimson' }}>에러: {err}</div>;
    if (!item) return <div className="safe-detail-loading">데이터가 없습니다.</div>;

    return (
        <div className="safe-detail-container">
            <nav className="safe-breadcrumb">
                <Link to="/">홈</Link>
                <span>&gt;</span>
                <Link to="/category">{item.category}</Link>
                <span>&gt;</span>
                <span>{item.title}</span>
            </nav>

            <div className="safe-detail-main">
                <div className="safe-detail-slider">
                    {images.length > 0 ? (
                        <Slider {...sliderSettings}>
                            {images.map((url, idx) => (
                                <div key={idx} className="safe-image-wrapper">
                                    <img src={url} alt={`${item.title} ${idx + 1}`} className="safe-slide-image" />
                                </div>
                            ))}
                        </Slider>
                    ) : (
                        <div className="safe-image-wrapper">
                            <div className="safe-slide-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                                이미지가 없습니다
                            </div>
                        </div>
                    )}
                </div>

                <div className="safe-detail-info">
                    <h1 className="safe-detail-title">{item.title}</h1>
                    <p className="safe-detail-price">{item.price.toLocaleString()}원</p>

                    <div className="safe-detail-meta">
                        <span>{new Date(item.createdDate).toLocaleDateString()}</span>
                        <span> · 조회 {item.viewCount}</span>
                        <span> · 채팅 {item.chatRoomCount}</span>
                        <span> · 찜 {favoriteCount}</span>
                    </div>

                    <div className="safe-detail-row">
                        <span className="label">거래방법</span>
                        <span className="value">🔒 안전거래</span>
                    </div>

                    <div className="safe-detail-row description-row">
                        <span className="label">상품설명</span>
                        <div className="value">
                            {(item.description || '').split('\n').map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}

                            {/* 판매자/구매자 분기 UI */}
                            {currentUser && (
                                <div className="safe-detail-action">
                                    {item.itemStatus === "SAFE_PENDING" ? (
                                        currentUser.id === item.userId ? (
                                            // ✅ 판매자일 때
                                            <div className="safe-detail-seller">
                                                <p className="safe-detail-status-banner green">
                                                    🔒 현재 안전결제가 완료되었습니다. 송장을 등록해야 거래가 진행됩니다.
                                                </p>
                                                <button className="safe-detail-btn safe-detail-btn-green">
                                                    송장 등록하기
                                                </button>
                                                <p className="safe-detail-subtext">
                                                    배송정보(택배사/송장번호)를 입력하면 구매자에게 자동으로 안내됩니다.
                                                </p>
                                            </div>
                                        ) : (
                                            // ✅ 구매자일 때
                                            <div className="safe-detail-buyer">
                                                <p className="safe-detail-status-banner yellow">
                                                    ⏳ 아직 판매자가 송장을 등록하지 않았습니다.
                                                </p>
                                                <div className="safe-detail-progress">
                                                    <span className="done">✔ 결제 완료</span>
                                                    <span className="active">📦 송장 등록 대기중</span>
                                                    <span>🚚 배송중</span>
                                                    <span>📥 수령</span>
                                                    <span>💳 포인트 지급</span>
                                                </div>
                                                <p className="safe-detail-subtext">
                                                    송장이 등록되면 알림으로 알려드리며, 이후 배송 조회가 가능합니다.
                                                </p>
                                            </div>
                                        )
                                    ) : (
                                        // SAFE_PENDING 외 상태
                                        currentUser.id === item.userId ? (
                                            <button className="safe-detail-btn safe-detail-btn-green">송장 등록</button>
                                        ) : (
                                            <button className="safe-detail-btn safe-detail-btn-blue">수령 확인</button>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
