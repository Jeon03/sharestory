export {};

declare global {
    interface IamportResponse {
        success: boolean;
        imp_uid: string;        // 아임포트 고유 결제번호
        merchant_uid: string;   // 가맹점 주문번호
        paid_amount: number;    // 결제 금액
        error_msg?: string;     // 실패 시 메시지
        [key: string]: unknown; // ✅ any → unknown
    }

    interface Window {
        IMP: {
            init: (accountId: string) => void;
            request_pay: (
                params: Record<string, unknown>,
                callback: (rsp: IamportResponse) => void
            ) => void;
        };
    }
}