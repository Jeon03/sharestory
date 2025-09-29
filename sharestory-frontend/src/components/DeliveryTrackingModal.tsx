import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import "../css/deliveryTrackingModal.css";

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
}

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function DeliveryTrackingModal({
                                                  itemId,
                                                  isOpen,
                                                  onClose,
                                              }: DeliveryTrackingModalProps) {
    const [tracking, setTracking] = useState<TrackingInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        (async () => {
            try {
                setLoading(true);
                const res = await fetch(
                    `${API_BASE}/api/items/${itemId}/delivery/tracking`,
                    { credentials: "include" }
                );
                if (!res.ok) throw new Error(await res.text());
                const data = await res.json();
                setTracking(data);
            } catch (e) {
                setError(e instanceof Error ? e.message : "조회 실패");
            } finally {
                setLoading(false);
            }
        })();
    }, [itemId, isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="delivery-modal-overlay">
                    {/* 모달 패널 */}
                    <motion.div
                        className="delivery-modal-panel"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.25 }}
                    >
                        <header className="delivery-modal-header">
                            <h2>📦 배송 조회</h2>
                            <button
                                className="delivery-modal-close"
                                onClick={onClose}
                            >
                                ✕
                            </button>
                        </header>

                        <main className="delivery-modal-body">
                            {loading && <div className="delivery-loading">조회 중…</div>}
                            {error && <div className="delivery-error">에러: {error}</div>}
                            {!loading && !error && tracking && (
                                <>
                                    <section className="delivery-summary">
                                        <p><b>택배사:</b> {tracking.courier}</p>
                                        <p><b>송장번호:</b> {tracking.trackingNumber}</p>
                                        <p>
                                            <b>현재 상태:</b>{" "}
                                            <span className="delivery-status">{tracking.status}</span>
                                        </p>
                                    </section>

                                    <section className="delivery-history">
                                        <h3>배송 진행 현황</h3>
                                        <h3>배송 진행 현황</h3>
                                        <ul>
                                            {tracking.history.map((h, idx) => {
                                                const formattedTime = new Date(h.time).toLocaleString("ko-KR", {
                                                    year: "numeric",
                                                    month: "2-digit",
                                                    day: "2-digit",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    second: "2-digit",
                                                });

                                                return (
                                                    <li key={idx} className="delivery-step">
                                                        <div className="delivery-time">⏰ {formattedTime}</div>
                                                        <div className="delivery-desc">🚚 {h.desc}</div>
                                                    </li>
                                                );
                                            })}
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
