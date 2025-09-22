/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";

interface ChatContextType {
    // 🔹 현재 열려있는 채팅방 (null이면 채팅목록)
    currentOpenRoomId: number | null;
    setCurrentOpenRoomId: React.Dispatch<React.SetStateAction<number | null>>;

    // 🔹 슬라이더 열림 상태
    isChatOpen: boolean;
    openChat: (roomId?: number | null) => void;
    closeChat: () => void;

    // 🔹 읽음/안읽음/마지막 메시지
    unreadCounts: { [roomId: number]: number };
    setUnreadCounts: React.Dispatch<React.SetStateAction<{ [roomId: number]: number }>>;
    lastMessages: { [roomId: number]: { content: string; updatedAt: string } };
    setLastMessages: React.Dispatch<
        React.SetStateAction<{ [roomId: number]: { content: string; updatedAt: string } }>
    >;
    // 🔹 전체 안읽음
    totalUnread: number;
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

    // ✅ 슬라이더 제어 함수
    const openChat = (roomId: number | null = null) => {
        setIsChatOpen(true);
        setCurrentOpenRoomId(roomId);
    };

    const closeChat = () => {
        setIsChatOpen(false);
        setCurrentOpenRoomId(null);
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
                unreadCounts,
                setUnreadCounts,
                lastMessages,
                setLastMessages,
                totalUnread,
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
