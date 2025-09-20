import { useState, useEffect } from "react";
import ChatRoomList from "./ChatRoomList";
import ChatRoom from "./ChatRoom";
import { useChatContext } from "../../contexts/ChatContext";

interface ChatSliderProps {
    isOpen: boolean;
    onClose: () => void;
    activeRoomId?: number | null;
    setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

export default function ChatSlider({
                                       isOpen,
                                       onClose,
                                       activeRoomId,
                                       setUnreadCount,
                                   }: ChatSliderProps) {
    const [activeRoom, setActiveRoom] = useState<number | null>(null);
    const { setCurrentOpenRoomId } = useChatContext();

    // ✅ 외부에서 activeRoomId 들어오면 반영
    useEffect(() => {
        if (activeRoomId) {
            setActiveRoom(activeRoomId);
            setCurrentOpenRoomId(activeRoomId); // 🔥 방 진입 시 Context에 등록
        }
    }, [activeRoomId, setCurrentOpenRoomId]);

    // ✅ 방 변경될 때 Context 업데이트
    useEffect(() => {
        if (activeRoom) {
            setCurrentOpenRoomId(activeRoom);
        } else {
            setCurrentOpenRoomId(null); // 방 나가면 초기화
        }
    }, [activeRoom, setCurrentOpenRoomId]);

    if (!isOpen) return null;

    return (
        <div className="chatroom-panel">
            {/* 헤더 */}
            <div className="chatroom-panel-header">
                <h2>{activeRoom ? `ShareStory #${activeRoom}` : "채팅 목록"}</h2>
                <button
                    onClick={() => {
                        if (activeRoom) {
                            setActiveRoom(null); // ✅ 목록으로 돌아감
                        } else {
                            onClose(); // ✅ 전체 닫기
                        }
                    }}
                >
                    ❌
                </button>
            </div>

            {/* 본문 */}
            <div className="chatroom-panel-body">
                {activeRoom ? (
                    <ChatRoom roomId={activeRoom} setUnreadCount={setUnreadCount} />
                ) : (
                    <ChatRoomList
                        onRoomSelect={(id) => {
                            setActiveRoom(id);
                            setCurrentOpenRoomId(id); // ✅ 채팅방 클릭 → Context 반영
                        }}
                    />
                )}
            </div>
        </div>
    );
}
