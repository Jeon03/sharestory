export interface ProductItem {
    id: number;
    title: string;
    price: number;
    imageUrl: string;
    createdDate: string;
    itemStatus: 'ON_SALE' | 'RESERVED' | 'SOLD_OUT' | string;
    status?: 'ON_SALE' | 'RESERVED' | 'SOLD_OUT';
    favoriteCount: number;
    viewCount: number;
    chatRoomCount: number;
    safeTrade: boolean;
    latitude?: number;
    longitude?: number;
    location?: string;
    modified?: boolean;
    updatedDate?: string;
}