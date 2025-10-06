export type ItemStatus =
    | 'ON_SALE' | 'RESERVED' | 'SOLD_OUT' | 'SAFE_DELIVERY' | 'SAFE_DELIVERY_START'
    | 'SAFE_DELIVERY_ING' | 'SAFE_DELIVERY_COMPLETE' | 'SAFE_DELIVERY_POINT_DONE'
    // 경매 관련 상태 추가
    | 'ON_AUCTION';

export type ShippingOption = 'included' | 'separate';

export interface DealInfo {
    parcel?: boolean;
    direct?: boolean;
    auction?: boolean;
    safeTrade?: boolean;
    shippingOption?: ShippingOption;
}

export interface ImageDto {
    id: number;
    url: string;
}

export interface UserDto {
    id: number;
    nickname: string;
}

export interface ItemDetail {
    id: number;
    userId: number;
    title: string;
    description: string;
    category: string;
    createdDate: string;
    updatedDate?: string;
    itemStatus: ItemStatus;
    condition: string;
    imageUrl?: string;
    images?: ImageDto[];
    dealInfo?: DealInfo;
    modified?: boolean;
    minPrice: number;
    finalBidPrice: number;
    auctionEnd: string;
    favoriteCount: number;
    highestBidder: UserDto | null;

    // --- [추가된 속성] ---
    buyNowPrice: number | null;
    buyNowAvailable: boolean;
}

export interface User {
    id: number;
    nickname: string;
    points: number;
}