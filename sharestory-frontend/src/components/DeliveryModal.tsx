import { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import { COURIERS } from "../constants/couriers";
import type { CourierOption } from "../constants/couriers";
import { getDeliveryInfo, registerInvoice, type DeliveryInfo } from "../api/delivery";
import "../css/deliveryModal.css";

type Props = {
    itemId: number;
    onClose: () => void;
    onSuccess?: (payload: { courierCode: string; trackingNumber: string }) => void;
};

type Option = { value: string; label: string };

export default function DeliveryModal({ itemId, onClose, onSuccess }: Props) {
    const [courier, setCourier] = useState<CourierOption | null>(null);
    const [trackingNumber, setTrackingNumber] = useState("");
    const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectOptions: Option[] = useMemo(
        () => COURIERS.map(c => ({ value: c.value, label: c.label })),
        []
    );

    // ✅ 배송지 정보 로딩
    useEffect(() => {
        (async () => {
            try {
                const info = await getDeliveryInfo(itemId);
                setDeliveryInfo(info);
            } catch (err) {
                console.error("배송지 정보 로딩 실패", err);
            }
        })();
    }, [itemId]);

    useEffect(() => {
        // ESC 닫기
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const selectedMeta = useMemo(
        () => COURIERS.find(c => c.value === courier?.value),
        [courier]
    );

    const validate = () => {
        if (!courier) return "배송사를 선택해주세요.";
        const tn = trackingNumber.trim();
        if (!tn) return "송장번호를 입력해주세요.";
        if (selectedMeta?.pattern && !selectedMeta.pattern.test(tn)) {
            return selectedMeta.hint
                ? `송장번호 형식이 올바르지 않습니다. (${selectedMeta.hint})`
                : "송장번호 형식이 올바르지 않습니다.";
        }
        if (tn.length < 6) return "송장번호는 6자 이상이어야 합니다.";
        return null;
    };

    const handleSubmit = async () => {
        const v = validate();
        if (v) {
            setError(v);
            inputRef.current?.focus();
            return;
        }
        setError(null);
        setSubmitting(true);

        try {
            if (!courier) throw new Error("배송사를 선택해주세요.");

            await registerInvoice(itemId, {
                courier: courier.value,
                trackingNumber: trackingNumber.trim(),
            });

            onSuccess?.({
                courierCode: courier.value,
                trackingNumber: trackingNumber.trim(),
            });
            onClose();
        } catch (e) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError("등록 중 알 수 없는 오류가 발생했습니다.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const onOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="safe-delivery-overlay" onClick={onOverlayClick}>
            <div className="safe-delivery-modal">
                <div className="safe-delivery-header">
                    <h3>송장 등록</h3>
                    <button className="safe-delivery-close" onClick={onClose} aria-label="close">
                        ×
                    </button>
                </div>

                <div className="safe-delivery-body">
                    {/* ✅ 구매자가 입력한 배송지 정보 표시 */}
                    {deliveryInfo && (
                        <div className="safe-delivery-box">
                            <p><b>수령인:</b> {deliveryInfo.name}</p>
                            <p><b>연락처:</b> {deliveryInfo.phone}</p>
                            <p><b>주소:</b> {deliveryInfo.address} {deliveryInfo.detail}</p>
                            <p><b>요청사항:</b> {deliveryInfo.requestMessage}</p>
                        </div>
                    )}

                    <label className="safe-delivery-label">배송사</label>
                    <Select
                        classNamePrefix="react-select"
                        options={selectOptions}
                        value={courier ? { value: courier.value, label: courier.label } : null}
                        onChange={(opt) => {
                            const found = COURIERS.find(c => c.value === (opt as Option)?.value) || null;
                            setCourier(found);
                        }}
                        placeholder="배송사를 선택하세요"
                        isSearchable
                    />
                    {selectedMeta?.hint && (
                        <p className="safe-delivery-hint">형식 힌트: {selectedMeta.hint}</p>
                    )}

                    <label className="safe-delivery-label">송장번호</label>
                    <input
                        ref={inputRef}
                        className="safe-delivery-input"
                        type="text"
                        placeholder="예: 1234-5678-9012"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value.replace(/\s+/g, ""))}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        autoFocus
                    />

                    {error && <div className="safe-delivery-error">{error}</div>}
                </div>

                <div className="safe-delivery-footer">
                    <button
                        className="safe-delivery-btn ghost"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        취소
                    </button>
                    <button
                        className="safe-delivery-btn primary"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? "등록 중..." : "등록"}
                    </button>
                </div>
            </div>
        </div>
    );
}
