import { fetchWithAuth } from "../utils/fetchWithAuth";

export interface DeliveryInfo {
    name: string;
    phone: string;
    address: string;
    detail: string;
    requestMessage: string;
    courier?: string | null;
    trackingNumber?: string | null;
}

/** ✅ 구매자 배송정보 등록 (경매) */
export async function registerAuctionDeliveryInfo(
    auctionId: number,
    payload: DeliveryInfo
): Promise<void> {
    const BASE = import.meta.env.VITE_API_BASE_URL || "";
    await fetchWithAuth(`${BASE}/api/orders/auction/${auctionId}/delivery`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
    });
}

/** ✅ 판매자 송장 등록 (경매) */
export async function registerAuctionInvoice(
    auctionId: number,
    payload: { courier: string; trackingNumber: string }
): Promise<void> {
    const BASE = import.meta.env.VITE_API_BASE_URL || "";
    await fetchWithAuth(`${BASE}/api/orders/auction/${auctionId}/delivery/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
    });
}

/** ✅ 배송지 정보 조회 (판매자 송장 등록 시 사용) */
export async function getAuctionDeliveryInfo(auctionId: number): Promise<DeliveryInfo> {
    const BASE = import.meta.env.VITE_API_BASE_URL || "";
    const res = await fetchWithAuth(`${BASE}/api/orders/auction/${auctionId}/delivery`, {
        method: "GET",
        credentials: "include",
    });
    return res.json();
}
