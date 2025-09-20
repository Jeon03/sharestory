// src/contexts/ChatContext.tsx
import { createContext, useContext, useState } from "react";

interface ChatContextType {
    currentOpenRoomId: number | null;
    setCurrentOpenRoomId: React.Dispatch<React.SetStateAction<number | null>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [currentOpenRoomId, setCurrentOpenRoomId] = useState<number | null>(null);

    return (
        <ChatContext.Provider value={{ currentOpenRoomId, setCurrentOpenRoomId }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChatContext() {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
    return ctx;
}