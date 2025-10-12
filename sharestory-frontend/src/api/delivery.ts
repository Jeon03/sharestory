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

// 배송지 정보 조회 (구매자가 입력한 주소 등)
export async function getDeliveryInfo(itemId: number): Promise<DeliveryInfo> {
    const BASE = import.meta.env.VITE_API_BASE_URL || "";
    const res = await fetchWithAuth(`${BASE}/api/items/${itemId}/delivery-info`, {
        method: "GET",
        credentials: "include",
    });
    return res.json();
}

// 송장 등록
export async function registerInvoice(
    itemId: number,
    payload: { courier: string; trackingNumber: string }
): Promise<void> {
    const BASE = import.meta.env.VITE_API_BASE_URL || "";
    await fetchWithAuth(`${BASE}/api/items/${itemId}/delivery/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
    });
}

/** ✅ 경매 거래용 배송지 조회 */
export async function getAuctionDeliveryInfo(auctionId: number): Promise<DeliveryInfo> {
    const BASE = import.meta.env.VITE_API_BASE_URL || "";
    const res = await fetchWithAuth(`${BASE}/api/orders/auction/${auctionId}/delivery`, {
        method: "GET",
        credentials: "include",
    });
    if (!res.ok) throw new Error("경매 배송정보 조회 실패");
    return res.json();
}
/** ✅ 경매 거래용 송장 등록 */
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