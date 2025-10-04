/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface ChatContextType {
    // 🔹 현재 열려있는 채팅방 (null이면 채팅목록)
    currentOpenRoomId: number | null;
    setCurrentOpenRoomId: React.Dispatch<React.SetStateAction<number | null>>;

    // 🔹 슬라이더 열림 상태
    isChatOpen: boolean;
    openChat: (roomId?: number | null) => void;
    closeChat: () => void;
    toggleChat: () => void;

    // 🔹 읽음/안읽음/마지막 메시지
    unreadCounts: { [roomId: number]: number };
    setUnreadCounts: React.Dispatch<React.SetStateAction<{ [roomId: number]: number }>>;
    lastMessages: { [roomId: number]: { content: string; updatedAt: string } };
    setLastMessages: React.Dispatch<
        React.SetStateAction<{ [roomId: number]: { content: string; updatedAt: string } }>
    >;

    // 🔹 전체 안읽음
    totalUnread: number;
    fetchUnreadCounts: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [currentOpenRoomId, setCurrentOpenRoomId] = useState<number | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const [unreadCounts, setUnreadCounts] = useState<{ [roomId: number]: number }>({});
    const [lastMessages, setLastMessages] = useState<{
        [roomId: number]: { content: string; updatedAt: string };
    }>({});

    const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

    const fetchUnreadCounts = useCallback(async () => {
        try {
            const res = await fetch(`/api/chat/unreadCounts`, { credentials: "include" });
            if (res.ok) {
                const data: {
                    unreadCounts: Record<number, number>;
                    totalUnread: number;
                } = await res.json();

                // console.log("📡 서버 unreadCounts:", data.unreadCounts);
                // console.log("📡 서버 totalUnread:", data.totalUnread);

                setUnreadCounts(data.unreadCounts || {});
            }
        } catch (err) {
            console.error("❌ Failed to fetch unread counts", err);
        }
    }, []);

    useEffect(() => {
        // ✅ 로그인 성공 이벤트 발생 시 실행
        const handler = () => {
            fetchUnreadCounts();
        };
        window.addEventListener("login-success", handler);

        fetchUnreadCounts();

        return () => {
            window.removeEventListener("login-success", handler);
        };
    }, [fetchUnreadCounts]);

    // ✅ 슬라이더 제어 함수
    const openChat = (roomId: number | null = null) => {
        setIsChatOpen(true);
        setCurrentOpenRoomId(roomId);
    };

    const closeChat = () => {
        setIsChatOpen(false);
        setCurrentOpenRoomId(null);
    };

    const toggleChat = () => {
        setIsChatOpen(prev => !prev);
        if (isChatOpen) {
            setCurrentOpenRoomId(null);
        }
    };

    useEffect(() => {
        console.log("📊 unreadCounts:", unreadCounts);
        console.log("📝 lastMessages:", lastMessages);
        console.log("📦 totalUnread:", totalUnread);
    }, [unreadCounts, lastMessages, totalUnread]);

    return (
        <ChatContext.Provider
            value={{
                currentOpenRoomId,
                setCurrentOpenRoomId,
                isChatOpen,
                openChat,
                closeChat,
                toggleChat,
                unreadCounts,
                setUnreadCounts,
                lastMessages,
                setLastMessages,
                totalUnread,
                fetchUnreadCounts,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

export function useChatContext() {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
    return ctx;
}
