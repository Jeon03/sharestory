import { useState, useEffect } from "react";
import ChatRoomList from "./ChatRoomList";
import ChatRoom from "./ChatRoom";

interface ChatSliderProps {
    isOpen: boolean;
    onClose: () => void;
    activeRoomId?: number | null;
}

export default function ChatSlider({ isOpen, onClose, activeRoomId }: ChatSliderProps) {
    const [activeRoom, setActiveRoom] = useState<number | null>(null);

    // ✅ 외부에서 activeRoomId가 들어오면 반영
    useEffect(() => {
        if (activeRoomId) {
            setActiveRoom(activeRoomId);
        }
    }, [activeRoomId]);

    if (!isOpen) return null;

    return (
        <div className="chatroom-panel">
            {/* 헤더 */}
            <div className="chatroom-panel-header">
                <h2>{activeRoom ? `ShareStory #${activeRoom}` : "채팅 목록"}</h2>
                <button
                    onClick={() => {
                        if (activeRoom) {
                            setActiveRoom(null); // ✅ 방 안이면 목록으로
                        } else {
                            onClose(); // ✅ 목록이면 닫기
                        }
                    }}
                >
                    ❌
                </button>
            </div>

            {/* 본문 */}
            <div className="chatroom-panel-body">
                {activeRoom ? (
                    <ChatRoom roomId={activeRoom} onBack={() => setActiveRoom(null)} />
                ) : (
                    <ChatRoomList onRoomSelect={(id) => setActiveRoom(id)} />
                )}
            </div>
        </div>
    );
}
