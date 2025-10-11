import { useEffect, useMemo, useRef, useState } from "react";
import { connectNotifications } from "../services/socketClient";
import type { NotificationPayload } from "../types/notification";
import { NotificationContext } from "./NotificationContext";
import { useAuth } from "../contexts/useAuth";
import type { Client } from "stompjs";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
    const stompRef = useRef<Client | null>(null);

    // ✅ 유저 변경 시 항상 최신 알림 로드 + STOMP 재연결
    useEffect(() => {
        if (!user?.id) return;

        // 기존 연결 정리
        if (stompRef.current?.connected) {
            stompRef.current.disconnect(() => console.log("🛑 기존 알림 연결 해제"));
        }

        // DB에서 기존 알림 로드
        (async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/notifications/${user.id}`,
                    { credentials: "include" }
                );
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data);
                }
            } catch (err) {
                console.error("❌ 알림 목록 불러오기 실패:", err);
            }
        })();

        // STOMP 연결
        const client = connectNotifications((noti) => {
            console.log("📩 새 알림 수신:", noti);
            setNotifications((prev) => [noti, ...prev]);
        });

        stompRef.current = client;

        return () => {
            if (stompRef.current?.connected)
                stompRef.current.disconnect(() => console.log("🛑 알림 연결 해제"));
        };
    }, [user?.id]); // ✅ user 변경 감시

    const markAsRead = async (id: number) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {
                method: "PATCH",
                credentials: "include",
            });

            if (res.ok) {
                // ✅ 로컬 상태 즉시 갱신
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.id === id
                            ? { ...n, isRead: true } // 읽음 표시 반영
                            : n
                    )
                );
            }
        } catch (err) {
            console.error("❌ 알림 읽음 처리 실패:", err);
        }
    };

    const value = useMemo(
        () => ({
            notifications,
            markAsRead,
            setNotifications,
        }),
        [notifications]
    );

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}
