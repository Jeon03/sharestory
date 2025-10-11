import { fetchWithAuth } from "../utils/fetchWithAuth";

const API_BASE = import.meta.env.VITE_API_BASE || '';

// 읽지 않은 알림 개수 조회
export const getUnreadNotificationCount = async () => {
    const response = await fetchWithAuth(`${API_BASE}/notifications/unread-count`);
    if (!response.ok) {
        throw new Error('Failed to fetch unread notification count.');
    }
    return await response.json();
};

// 내 알림 목록 조회
export const getMyNotifications = async () => {
    const response = await fetchWithAuth(`${API_BASE}/notifications`);
    if (!response.ok) {
        throw new Error('Failed to fetch notifications.');
    }
    return await response.json();
};

// 모든 알림을 읽음 처리
export const markAllNotificationsAsRead = async () => {
    const response = await fetchWithAuth(`${API_BASE}/notifications/read-all`, {
        method: 'POST',
    });
    if (!response.ok) {
        throw new Error('Failed to mark notifications as read.');
    }
};