export interface User {
    id: number;
    email: string;
    nickname: string;
    role: string;

    myLatitude?: number;
    myLongitude?: number;
    addressName?: string;
    points?: number;
    authenticated?: boolean;
}