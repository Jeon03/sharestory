import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Slider from 'react-slick';
import '../css/productDetail.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import type { CustomArrowProps, Settings } from 'react-slick';
import { Heart } from 'lucide-react';

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
    images?: string[];
    dealInfo?: DealInfo;
}

const API_BASE = import.meta?.env?.VITE_API_BASE ?? 'http://localhost:8081';

function PrevArrow({ className, style, onClick }: CustomArrowProps) {
    return (
        <div
            className={className}
            style={{ ...style, display: 'block', left: 20, zIndex: 1 }}
            onClick={onClick}
        />
    );
}

function NextArrow({ className, style, onClick }: CustomArrowProps) {
    return (
        <div
            className={className}
            style={{ ...style, display: 'block', right: 20, zIndex: 1 }}
            onClick={onClick}
        />
    );
}

export default function ProductDetailSimple() {
    const { id } = useParams();
    const [item, setItem] = useState<ItemDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // ❤️ 관심상품 상태
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteCount, setFavoriteCount] = useState(0);

    useEffect(() => {
        if (!id) return;
        let aborted = false;

        (async () => {
            try {
                setLoading(true);
                setErr(null);

                // 상품 상세
                const r = await fetch(`${API_BASE}/api/items/${id}`, {
                    credentials: 'include',
                });
                if (!r.ok) throw new Error(await r.text());
                const data = (await r.json()) as ItemDetail;
                if (!aborted) setItem(data);

                // 관심 여부 + 개수
                const f = await fetch(`${API_BASE}/api/favorites/${id}`, {
                    credentials: 'include',
                });
                if (f.ok) {
                    const fav = await f.json();
                    if (!aborted) {
                        setIsFavorite(fav.isFavorite);
                        setFavoriteCount(fav.favoriteCount ?? 0);
                    }
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

    // ❤️ 토글 함수
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

    const images = useMemo(() => {
        if (!item) return [] as string[];
        const arr =
            Array.isArray(item.images) && item.images.length > 0
                ? item.images
                : item.imageUrl
                    ? [item.imageUrl]
                    : [];
        return arr.filter(Boolean) as string[];
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
    if (err)
        return (
            <div className="detail-loading" style={{ color: 'crimson' }}>
                에러: {err}
            </div>
        );
    if (!item) return <div className="detail-loading">데이터가 없습니다.</div>;

    return (
        <div className="detail-container">
            {/* 브레드크럼 */}
            <nav className="breadcrumb">
                <Link to="/">홈</Link> &gt;{' '}
                <Link to="/category">{item.category}</Link> &gt;{' '}
                <span>{item.title}</span>
            </nav>

            <div className="detail-main">
                {/* 이미지 슬라이더 */}
                <div className="detail-slider">
                    {images.length > 0 ? (
                        <Slider {...sliderSettings}>
                            {images.map((url, idx) => (
                                <div key={idx} className="image-wrapper">
                                    <img
                                        src={url}
                                        alt={`${item.title} ${idx + 1}`}
                                        className="slide-image"
                                    />
                                    {item.itemStatus === 'RESERVED' && (
                                        <div className="status-overlay reserved">예약중</div>
                                    )}
                                    {item.itemStatus === 'SOLD_OUT' && (
                                        <div className="status-overlay sold">판매완료</div>
                                    )}
                                    {[
                                        'SAFE_DELIVERY',
                                        'SAFE_DELIVERY_START',
                                        'SAFE_DELIVERY_ING',
                                        'SAFE_DELIVERY_COMPLETE',
                                    ].includes(item.itemStatus) && (
                                        <div className="status-overlay in-progress">
                                            거래 진행중
                                        </div>
                                    )}
                                    {item.itemStatus === 'SAFE_DELIVERY_POINT_DONE' && (
                                        <div className="status-overlay done">거래 완료</div>
                                    )}
                                </div>
                            ))}
                        </Slider>
                    ) : (
                        <div className="image-wrapper">
                            <div
                                className="slide-image"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#888',
                                }}
                            >
                                이미지가 없습니다
                            </div>
                        </div>
                    )}
                </div>

                {/* 상세 정보 */}
                <div className="detail-info">
                    <h1 className="detail-title">{item.title}</h1>

                    <div className="detail-meta-top">
                        <span className="category">{item.category}</span>
                        <span> · </span>
                        <span className="time">
              {new Date(item.createdDate).toLocaleString()}
            </span>
                    </div>

                    <p className="detail-price">{item.price.toLocaleString()}원</p>

                    {/* ❤️ 관심상품 버튼 */}
                    <button onClick={toggleFavorite} className="favorite-btn">
                        {isFavorite ? (
                            <Heart fill="red" stroke="red" size={24} />
                        ) : (
                            <Heart stroke="gray" size={24} />
                        )}
                        <span style={{ marginLeft: 6 }}>{favoriteCount}</span>
                    </button>

                    <div className="detail-description">
                        {(item.description || '').split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </div>

                    <table className="detail-table">
                        <tbody>
                        <tr>
                            <th>상품상태</th>
                            <td>{item.condition ?? '-'}</td>
                        </tr>
                        <tr>
                            <th>거래방식</th>
                            <td>
                                {[
                                    item.dealInfo?.parcel && '택배거래',
                                    item.dealInfo?.direct && '직거래',
                                    item.dealInfo?.safeTrade && '🔒안전거래',
                                    item.dealInfo?.shippingOption &&
                                    `(배송비: ${
                                        item.dealInfo.shippingOption === 'included'
                                            ? '포함'
                                            : '별도'
                                    })`,
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
