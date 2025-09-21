/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";

interface ChatContextType {
    currentOpenRoomId: number | null;
    setCurrentOpenRoomId: React.Dispatch<React.SetStateAction<number | null>>;
    unreadCounts: { [roomId: number]: number };
    setUnreadCounts: React.Dispatch<React.SetStateAction<{ [roomId: number]: number }>>;
    lastMessages: { [roomId: number]: { content: string; updatedAt: string } };
    setLastMessages: React.Dispatch<
        React.SetStateAction<{ [roomId: number]: { content: string; updatedAt: string } }>
    >;
    totalUnread: number;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [currentOpenRoomId, setCurrentOpenRoomId] = useState<number | null>(null);

    const [unreadCounts, setUnreadCounts] = useState<{ [roomId: number]: number }>({});
    const [lastMessages, setLastMessages] = useState<{
        [roomId: number]: { content: string; updatedAt: string };
    }>({});

    const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

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
