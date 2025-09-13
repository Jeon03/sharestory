// types/item.ts
export interface ItemSummary {
    id: number;
    title: string;
    price: number;
    imageUrl?: string;
    createdDate?: string | null;
    itemStatus: "ON_SALE" | "SOLD_OUT" | string;
    favoriteCount: number;
    viewCount: number;
    chatRoomCount: number;
    latitude?: number;
    longitude?: number;
    location?: string; // 프론트에서 kakao api로 변환한 행정동 이름
}
