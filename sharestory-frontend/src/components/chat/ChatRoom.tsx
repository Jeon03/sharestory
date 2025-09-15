import { useEffect, useState } from "react";
import { connect, disconnect, sendMessage } from "../../services/socketClient";
import "../../css/chat.css";

interface ChatRoomProps {
    roomId: number;
    onBack: () => void;
}

// 서버에서 오는 메시지 타입
interface ServerMessage {
    content: string;
    senderId: number;
    createdAt: string;
}

// 화면에서 사용하는 메시지 타입
interface ChatMsg {
    content: string;
    mine: boolean;
    time: string;
}

interface ItemInfo {
    id: number;
    title: string;
    price: number;
    imageUrl: string;
    description: string;
}

export default function ChatRoom({ roomId }: ChatRoomProps) {
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [input, setInput] = useState("");
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [item, setItem] = useState<ItemInfo | null>(null);

    // ✅ 로그인 사용자 정보 가져오기
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/main`, {
                    credentials: "include",
                });
                if (res.ok) {
                    const user = await res.json();
                    setCurrentUserId(user.id);
                }
            } catch (e) {
                console.error("사용자 정보 불러오기 실패:", e);
            }
        })();
    }, []);

    // ✅ 채팅방의 상품 정보 가져오기
    useEffect(() => {
        async function fetchItem() {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/room/${roomId}/item`, {
                    credentials: "include",
                });
                if (res.ok) {
                    const data: ItemInfo = await res.json();
                    setItem(data);
                }
            } catch (err) {
                console.error("상품 정보 불러오기 실패:", err);
            }
        }
        fetchItem();
    }, [roomId]);

    // ✅ 채팅 내역 불러오기
    useEffect(() => {
        if (!currentUserId) return;
        (async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/chat/room/${roomId}/messages`,
                    { credentials: "include" }
                );
                if (res.ok) {
                    const data: ServerMessage[] = await res.json();
                    const formatted: ChatMsg[] = data.map((msg) => ({
                        content: msg.content,
                        mine: msg.senderId === currentUserId,
                        time: new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                    }));
                    setMessages(formatted);
                }
            } catch (e) {
                console.error("채팅 내역 불러오기 실패:", e);
            }
        })();
    }, [roomId, currentUserId]);

    // ✅ 실시간 수신 (WebSocket)
    useEffect(() => {
        if (!currentUserId) return;

        connect(roomId, (msg: ServerMessage) => {
            setMessages((prev) => [
                ...prev,
                {
                    content: msg.content,
                    mine: msg.senderId === currentUserId,
                    time: new Date(msg.createdAt ?? Date.now()).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                },
            ]);
        });

        return () => disconnect();
    }, [roomId, currentUserId]);

    // ✅ 메시지 전송
    const handleSend = () => {
        if (input.trim() !== "" && currentUserId !== null) {
            sendMessage(roomId, input, currentUserId);
            setInput("");
        }
    };

    return (
        <div className="chat-container">
            {/* 상단 상품 정보 */}
            {item && (
                <div className="chat-room-item-header">
                    <img src={item.imageUrl} alt={item.title} className="chat-room-item-thumb" />
                    <div className="chat-room-item-info">
                        <div className="chat-room-item-price">{item.price.toLocaleString()}원</div>
                        <div className="chat-room-item-desc">{item.description}</div>
                    </div>
                </div>
            )}

            {/* 메시지 영역 */}
            <div className="chat-messages">
                {messages.map((m, i) => (
                    <div key={i} className={`chat-bubble ${m.mine ? "mine" : "other"}`}>
                        {m.content}
                        <div className="message-time">{m.time}</div>
                    </div>
                ))}
            </div>

            {/* 입력창 */}
            <div className="chat-input">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="메시지를 입력하세요"
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button onClick={handleSend}>전송</button>
            </div>
        </div>
    );
}
