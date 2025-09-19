// src/types/dealInfo.ts
export type DealInfo = {
    parcel: boolean;
    direct: boolean;
    auction: boolean;
    shippingOption: string;
    phoneNumber?: string;
    safeTrade?: boolean;
};
