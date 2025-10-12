import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import "../css/deliveryTrackingModal.css";
import { FiX, FiRefreshCw } from "react-icons/fi";

interface TrackingHistory {
    time: string;
    desc: string;
}

interface TrackingInfo {
    courier: string;
    trackingNumber: string;
    status: string;
    history: TrackingHistory[];
}

interface DeliveryTrackingModalProps {
    itemId: number;
    isOpen: boolean;
    onClose: () => void;
    isAuction?: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function DeliveryTrackingModal({
                                                  itemId,
                                                  isOpen,
                                                  onClose,
                                                  isAuction = false, // 기본값: 일반 상품
                                              }: DeliveryTrackingModalProps) {
    const [tracking, setTracking] = useState<TrackingInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /** ✅ API 호출 */
    const fetchTracking = async () => {
        try {
            setLoading(true);
            setError(null);

            // ✅ 경매 상품이면 다른 API 호출
            const url = isAuction
                ? `${API_BASE}/api/orders/auction/${itemId}/delivery/tracking`
                : `${API_BASE}/api/items/${itemId}/delivery/tracking`;

            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) throw new Error(await res.text());
            const data = (await res.json()) as TrackingInfo;
            setTracking(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "조회 실패");
        } finally {
            setLoading(false);
        }
    };

    /** ✅ Polling (1분 주기) */
    useEffect(() => {
        if (!isOpen) return;
        fetchTracking();
        const interval = setInterval(fetchTracking, 60 * 1000);
        return () => clearInterval(interval);
    }, [isOpen, itemId, isAuction]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="delivery-modal-overlay">
                    <motion.div
                        className="delivery-modal-panel"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.25 }}
                    >
                        <header className="delivery-modal-header">
                            <h2>📦 배송 조회</h2>
                            <div className="delivery-header-actions">
                                <button
                                    className="delivery-icon-btn"
                                    onClick={fetchTracking}
                                    disabled={loading}
                                    title="새로고침"
                                >
                                    <FiRefreshCw size={18} />
                                </button>
                                <button
                                    className="delivery-icon-btn"
                                    onClick={onClose}
                                    title="닫기"
                                >
                                    <FiX size={18} />
                                </button>
                            </div>
                        </header>

                        <main className="delivery-modal-body">
                            {loading && <div className="delivery-loading">조회 중…</div>}
                            {error && <div className="delivery-error">에러: {error}</div>}
                            {!loading && !error && tracking && (
                                <>
                                    <section className="delivery-summary">
                                        <p>
                                            <b>택배사:</b> {tracking.courier}
                                        </p>
                                        <p>
                                            <b>송장번호:</b> {tracking.trackingNumber}
                                        </p>
                                        <p>
                                            <b>현재 상태:</b>{" "}
                                            <span className="delivery-status">{tracking.status}</span>
                                        </p>
                                    </section>

                                    <section className="delivery-history">
                                        <h3>배송 진행 현황</h3>
                                        <ul>
                                            {tracking.history.map((h, idx) => (
                                                <li key={idx} className="delivery-step">
                                                    <div className="delivery-time">
                                                        ⏰ {new Date(h.time).toLocaleString("ko-KR")}
                                                    </div>
                                                    <div className="delivery-desc">🚚 {h.desc}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                </>
                            )}
                        </main>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
