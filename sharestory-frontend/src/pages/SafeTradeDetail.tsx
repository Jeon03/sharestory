import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import type { CustomArrowProps, Settings } from 'react-slick';
import Slider from 'react-slick';
import '../css/safeProductDetail.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import DeliveryModal from "../components/DeliveryModal";
import DeliveryTrackingModal from "../components/DeliveryTrackingModal";
import { useAuth } from "../contexts/useAuth";

type ItemStatus =
    | 'SAFE_PENDING'
    | 'SAFE_READY'
    | 'SAFE_START'
    | 'SAFE_ING'
    | 'SAFE_COMPLETE'
    | 'SAFE_RECEIVED'
    | 'SAFE_FINISHED';

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

const API_BASE = import.meta?.env?.VITE_API_BASE || '';

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

export default function SafeProductDetail() {
    const { id } = useParams();
    const [item, setItem] = useState<ItemDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [favoriteCount, setFavoriteCount] = useState(0);
    const { user: currentUser, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [showTrackingModal, setShowTrackingModal] = useState(false);

    useEffect(() => {
        if (!id) return;
        (async () => {
            const res = await fetch(`${API_BASE}/api/items/${id}`, { credentials: "include" });
            if (!res.ok) return;
            const data = await res.json();
            setItem(data);

            // 안전거래 주문 없는 상품 → 일반 상세로 이동
            if (!data.hasSafeOrder && location.pathname.startsWith("/safe-items/")) {
                navigate(`/items/${id}`, { replace: true });
            }
        })();
    }, [id, navigate, location]);

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
                    if (!aborted) setFavoriteCount(fav.favoriteCount ?? 0);
                }
            } catch (e) {
                if (!aborted) setErr(e instanceof Error ? e.message : '요청 실패');
            } finally {
                if (!aborted) setLoading(false);
            }
        })();

        return () => { aborted = true; };
    }, [id]);

    const images = useMemo(() => {
        if (!item) return [];
        if (Array.isArray(item.images) && item.images.length > 0) {
            return item.images.map((img) => img.url);
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
                {/* 이미지 슬라이더 */}
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

                {/* 상품 정보 */}
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
                            {(item.description || '').split('\n').map((line, i) => <p key={i}>{line}</p>)}

                            {/* 판매자 / 구매자 분기 */}
                            {currentUser && (
                                <div className="safe-detail-action">
                                    {currentUser.id === item.userId ? (
                                        // ✅ 판매자 UI
                                        <div className="safe-detail-seller">
                                            {item.itemStatus === "SAFE_PENDING" && (
                                                <>
                                                    <div className="safe-detail-progress">
                                                        <span className="done">✔ 결제 완료</span>
                                                        <span className="active">📦 송장 등록 대기중</span>
                                                        <span>🚚 배송중</span>
                                                        <span>📥 수령</span>
                                                        <span>💳 포인트 지급</span>
                                                    </div>
                                                    <div className="safe-detail-buttons">
                                                        <button className="safe-detail-btn safe-detail-btn-green" onClick={() => setShowDeliveryModal(true)}>송장 등록하기</button>
                                                    </div>
                                                    <p className="safe-detail-subtext">배송정보(택배사/송장번호)를 입력하면 구매자에게 자동 안내됩니다.</p>
                                                </>
                                            )}

                                            {["SAFE_READY", "SAFE_START", "SAFE_ING", "SAFE_COMPLETE", "SAFE_RECEIVED", "SAFE_FINISHED"].includes(item.itemStatus) && (
                                                <>
                                                    <div className="safe-detail-progress">
                                                        <span className="done">✔ 결제 완료</span>
                                                        <span className={item.itemStatus !== "SAFE_PENDING" ? "done" : "active"}>📦 송장 등록</span>
                                                        <span className={["SAFE_START","SAFE_ING","SAFE_COMPLETE","SAFE_RECEIVED","SAFE_FINISHED"].includes(item.itemStatus) ? "done" : (item.itemStatus==="SAFE_READY" ? "active":"")}>🚚 배송중</span>
                                                        <span className={["SAFE_COMPLETE","SAFE_RECEIVED","SAFE_FINISHED"].includes(item.itemStatus) ? "done" : (item.itemStatus==="SAFE_ING" ? "active":"")}>📥 수령</span>
                                                        <span className={["SAFE_RECEIVED","SAFE_FINISHED"].includes(item.itemStatus) ? "done" : (item.itemStatus==="SAFE_COMPLETE" ? "active":"")}>💳 포인트 지급</span>
                                                    </div>

                                                    <div className="safe-detail-buttons">
                                                        <button className="safe-detail-btn safe-detail-btn-blue" onClick={() => setShowTrackingModal(true)}>내 배송 조회하기</button>

                                                        {item.itemStatus === "SAFE_RECEIVED" && (
                                                            <button
                                                                className="safe-detail-btn safe-detail-btn-green"
                                                                onClick={async () => {
                                                                    try {
                                                                        const res = await fetch(`${API_BASE}/api/items/${item.id}/payout`, { method: "PATCH", credentials: "include" });
                                                                        if (!res.ok) throw new Error("포인트 수령 실패");
                                                                        alert("✅ 포인트가 적립되었습니다.");
                                                                        setItem(prev => prev ? { ...prev, itemStatus: "SAFE_FINISHED" } : prev);
                                                                        await refreshUser();
                                                                    } catch (e) {
                                                                        console.error("포인트 수령 오류:", e);
                                                                        alert("❌ 포인트 수령 중 오류 발생");
                                                                    }
                                                                }}
                                                            >포인트 수령하기</button>
                                                        )}

                                                        {item.itemStatus === "SAFE_FINISHED" && (
                                                            <button className="safe-detail-btn safe-detail-btn-green" onClick={() => navigate("/mypage/points")}>포인트 적립 내역보기</button>
                                                        )}
                                                    </div>

                                                    {item.itemStatus === "SAFE_FINISHED" && (
                                                        <p className="safe-detail-status-banner gray">🎉 거래가 완료되었습니다. 배송은 종료되었으며 포인트가 판매자에게 지급되었습니다.</p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        // ✅ 구매자 UI
                                        <div className="safe-detail-buyer">
                                            {item.itemStatus === "SAFE_PENDING" && (
                                                <>
                                                    <div className="safe-detail-progress">
                                                        <span className="done">✔ 결제 완료</span>
                                                        <span className="active">📦 송장 등록 대기중</span>
                                                        <span>🚚 배송중</span>
                                                        <span>📥 수령</span>
                                                        <span>💳 포인트 지급</span>
                                                    </div>
                                                    <p className="safe-detail-status-banner yellow">⏳ 아직 판매자가 송장을 등록하지 않았습니다.</p>
                                                </>
                                            )}

                                            {["SAFE_READY","SAFE_START","SAFE_ING"].includes(item.itemStatus) && (
                                                <>
                                                    <div className="safe-detail-progress">
                                                        <span className="done">✔ 결제 완료</span>
                                                        <span className="done">📦 송장 등록</span>
                                                        <span className="active">🚚 배송중</span>
                                                        <span>📥 수령</span>
                                                        <span>💳 포인트 지급</span>
                                                    </div>
                                                    <div className="safe-detail-buttons">
                                                        <button className="safe-detail-btn safe-detail-btn-blue" onClick={() => setShowTrackingModal(true)}>상품 배송 조회하기</button>
                                                    </div>
                                                </>
                                            )}

                                            {item.itemStatus === "SAFE_COMPLETE" && (
                                                <>
                                                    <div className="safe-detail-progress">
                                                        <span className="done">✔ 결제 완료</span>
                                                        <span className="done">📦 송장 등록</span>
                                                        <span className="done">🚚 배송중</span>
                                                        <span className="active">📥 수령</span>
                                                        <span>💳 포인트 지급</span>
                                                    </div>
                                                    <div className="safe-detail-buttons">
                                                        <button className="safe-detail-btn safe-detail-btn-blue" onClick={() => setShowTrackingModal(true)}>상품 배송 조회하기</button>
                                                        <button
                                                            className="safe-detail-btn safe-detail-btn-green"
                                                            onClick={async () => {
                                                                try {
                                                                    const res = await fetch(`${API_BASE}/api/items/${item.id}/confirm-receipt`, { method: "PATCH", credentials: "include" });
                                                                    if (!res.ok) throw new Error("수령 확인 실패");
                                                                    alert("✅ 수령이 확인되었습니다. 포인트가 판매자에게 지급 대기중입니다.");
                                                                    setItem(prev => prev ? { ...prev, itemStatus: "SAFE_RECEIVED" } : prev);
                                                                } catch (e) {
                                                                    console.error("수령 오류:", e);
                                                                    alert("❌ 수령 처리 중 오류 발생");
                                                                }
                                                            }}
                                                        >물품 수령 확인</button>
                                                    </div>
                                                </>
                                            )}

                                            {item.itemStatus === "SAFE_RECEIVED" && (
                                                <>
                                                    <div className="safe-detail-progress">
                                                        <span className="done">✔ 결제 완료</span>
                                                        <span className="done">📦 송장 등록</span>
                                                        <span className="done">🚚 배송중</span>
                                                        <span className="done">📥 수령</span>
                                                        <span className="active">💳 포인트 지급</span>
                                                    </div>
                                                    <div className="safe-detail-buttons">
                                                        <button className="safe-detail-btn safe-detail-btn-blue" onClick={() => setShowTrackingModal(true)}>상품 배송 조회하기</button>
                                                    </div>
                                                    <p className="safe-detail-status-banner gray">✅ 수령 확인이 완료되었습니다. 판매자가 포인트를 수령할 때까지 기다려주세요.</p>
                                                </>
                                            )}

                                            {item.itemStatus === "SAFE_FINISHED" && (
                                                <>
                                                    <div className="safe-detail-progress">
                                                        <span className="done">✔ 결제 완료</span>
                                                        <span className="done">📦 송장 등록</span>
                                                        <span className="done">🚚 배송중</span>
                                                        <span className="done">📥 수령</span>
                                                        <span className="done">💳 포인트 지급</span>
                                                    </div>
                                                    <div className="safe-detail-buttons">
                                                        <button className="safe-detail-btn safe-detail-btn-blue" onClick={() => setShowTrackingModal(true)}>상품 배송 조회하기</button>
                                                    </div>
                                                    <p className="safe-detail-status-banner gray">🎉 거래가 완료되었습니다. 포인트가 판매자에게 지급되었습니다.</p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showDeliveryModal && (
                <DeliveryModal
                    itemId={item.id}
                    onClose={() => setShowDeliveryModal(false)}
                    onSuccess={({ courierCode, trackingNumber }) => {
                        alert(`송장 등록 완료!\n택배사: ${courierCode}\n운송장번호: ${trackingNumber}`);
                        setItem(prev => prev ? { ...prev, itemStatus: "SAFE_READY" } : prev);
                        setShowDeliveryModal(false);
                    }}
                />
            )}

            <DeliveryTrackingModal
                itemId={item.id}
                isOpen={showTrackingModal}
                onClose={() => setShowTrackingModal(false)}
            />
        </div>
    );
}
