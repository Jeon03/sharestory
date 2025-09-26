import { useState, useEffect } from "react";
import ChatRoomList from "./ChatRoomList";
import ChatRoom from "./ChatRoom";
import { useChatContext } from "../../contexts/ChatContext";
import "../../css/ChatSlider.css";
import { useAuth } from "../../contexts/useAuth";

interface ChatSliderProps {
    isOpen: boolean;
    onClose: () => void;
    activeRoomId?: number | null;
}

const TRANSITION_MS = 300;

export default function ChatSlider({ isOpen, onClose, activeRoomId }: ChatSliderProps) {
    const [activeRoom, setActiveRoom] = useState<number | null>(null);
    const { setCurrentOpenRoomId } = useChatContext();
    const { openLogin } = useAuth();

    // 👇 애니메이션 제어 상태
    const [mounted, setMounted] = useState(false);
    const [openClass, setOpenClass] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            // 다음 프레임에 open 클래스 적용 → slide-in 애니메이션
            requestAnimationFrame(() => setOpenClass(true));
        } else {
            setOpenClass(false);
            const t = setTimeout(() => setMounted(false), TRANSITION_MS);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

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

    if (!mounted) return null;

    return (
        <>
            <div className={`chatroom-overlay ${openClass ? "open" : ""}`} onClick={onClose} />
            <div className={`chatroom-panel ${openClass ? "open" : ""}`}>
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
            </div>
        </>
    );
}
