import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyNotifications } from '../services/notificationApi';
import '../css/NotificationDropdown.css'; // CSS 파일은 아래에서 생성

interface Notification {
    id: number;
    message: string;
    link: string;
    isRead: boolean;
    createdAt: string;
}

const formatTimeAgo = (dateStr: string): string => {
    const created = new Date(dateStr).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - created);
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return '방금 전';
    if (min < 60) return `${min}분 전`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}시간 전`;
    const day = Math.floor(hr / 24);
    return `${day}일 전`;
};

export default function NotificationDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await getMyNotifications();
                setNotifications(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    if (isLoading) {
        return <div className="notification-dropdown"><p>로딩 중...</p></div>;
    }

    return (
        <div className="notification-dropdown">
            <div className="notification-header">
                <h4>알림</h4>
            </div>
            <ul className="notification-list">
                {notifications.length === 0 ? (
                    <li className="no-notifications">새로운 알림이 없습니다.</li>
                ) : (
                    notifications.map(notif => (
                        <li key={notif.id} className={notif.isRead ? 'read' : 'unread'}>
                            <Link to={notif.link}>
                                <p className="notification-message">{notif.message}</p>
                                <span className="notification-time">{formatTimeAgo(notif.createdAt)}</span>
                            </Link>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}