export interface NotificationPayload {
    id: number;
    type: string;
    message: string;
    referenceId: number;
    createdAt: string;
    isRead?: boolean;
}