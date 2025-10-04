import { useState, useEffect } from "react";
import ChatRoomList from "./ChatRoomList";
import ChatRoom from "./ChatRoom";
import { useChatContext } from "../../contexts/ChatContext";
import { useAuth } from "../../contexts/useAuth";
import { AnimatePresence, motion } from "framer-motion";
import "../../css/ChatSlider.css";

interface ChatSliderProps {
    isOpen: boolean;
    onClose: () => void;
    activeRoomId?: number | null;
}

export default function ChatSlider({ isOpen, onClose, activeRoomId }: ChatSliderProps) {
    const [activeRoom, setActiveRoom] = useState<number | null>(null);
    const { setCurrentOpenRoomId } = useChatContext();
    const { openLogin } = useAuth();

    // ESC 닫기
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    // 외부 activeRoomId 반영
    useEffect(() => {
        if (activeRoomId) {
            setActiveRoom(activeRoomId);
            setCurrentOpenRoomId(activeRoomId);
        }
    }, [activeRoomId, setCurrentOpenRoomId]);

    // 방 변경 시 컨텍스트 업데이트
    useEffect(() => {
        setCurrentOpenRoomId(activeRoom ?? null);
    }, [activeRoom, setCurrentOpenRoomId]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 오버레이 */}
                    <motion.div
                        className="chatroom-overlay"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    />

                    {/* 패널 */}
                    <motion.div
                        className="chatroom-panel"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "tween", duration: 0.3 }}
                    >
                        <div className="chatroom-panel-header">
                            <h2>{activeRoom ? `ShareStory #${activeRoom}` : "채팅 목록"}</h2>
                            <button
                                onClick={() => {
                                    if (activeRoom) setActiveRoom(null);
                                    else onClose();
                                }}
                            >
                                ❌
                            </button>
                        </div>

                        <div className="chatroom-panel-body">
                            {activeRoom ? (
                                <ChatRoom roomId={activeRoom} />
                            ) : (
                                <ChatRoomList
                                    onRoomSelect={(id) => {
                                        setActiveRoom(id);
                                        setCurrentOpenRoomId(id);
                                    }}
                                    onRequireLogin={() => {
                                        onClose();
                                        openLogin();
                                    }}
                                />
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
