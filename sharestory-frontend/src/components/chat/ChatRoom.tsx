import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { connect, disconnect, sendMessage, sendReadEvent } from "../../services/socketClient";
import "../../css/chat.css";
import { Image, MapPin, X } from "lucide-react";
import LocationPickerModal from "../LocationPickerModal.tsx";
import kakaomapIcon from "../../images/kakaomap_basic.png";
import { useChatContext } from "../../contexts/ChatContext";
import type { MessageType } from "../../services/socketClient";
import { useAuth } from "../../contexts/useAuth";
import { fetchWithAuth } from "../../utils/fetchWithAuth";

interface ChatRoomProps {
    roomId: number;
}

interface ChatMsg {
    id: number;
    content: string;
    mine: boolean;
    time: string;
    rawTime: string;
    type: MessageType;
    read: boolean;
}

interface ItemInfo {
    id: number;
    title: string;
    price?: number; // 일반 거래
    currentPrice?: number; // 경매 현재가
    startPrice?: number; // 경매 시작가
    immediatePrice?: number; // 즉시구매가
    imageUrl?: string;
    mainImageUrl?: string;
    description?: string;
    type?: 'ITEM' | 'AUCTION'; // 백엔드에서 추가한 type 필드도 반영
}

interface ServerMessage {
    id: number;
    roomId: number;
    senderId: number;
    content: string;
    type: MessageType;
    createdAt: string;
    read: boolean;
}

const DateDivider = ({ date }: { date: string }) => (
    <div className="chat-date-divider">{date}</div>
);

export default function ChatRoom({ roomId }: ChatRoomProps) {
    const { setCurrentOpenRoomId, setUnreadCounts } = useChatContext();

    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [input, setInput] = useState("");
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [item, setItem] = useState<ItemInfo | null>(null);

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [showMap, setShowMap] = useState(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const inputWrapperRef = useRef<HTMLDivElement | null>(null);
    const [bottomPadding, setBottomPadding] = useState(80);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const { openLogin } = useAuth();

    /** ✅ 세션스토리지 → 프리셋 메시지 로드 */
    useEffect(() => {
        const key = `chat:preset:${roomId}`;
        const draft = sessionStorage.getItem(key);
        if (draft) {
            console.log("📩 [ChatRoom] sessionStorage preset 로드:", draft);
            setInput(draft);
            sessionStorage.removeItem(key); // 1회성
        }
    }, [roomId]);

    /** ✅ 방 입장/퇴장 + 읽음 처리 */
    useEffect(() => {
        setCurrentOpenRoomId(roomId);

        // ✅ 현재 열린 채팅방을 Service Worker에 알려주기 (FCM 알림 차단용)
        const bc = new BroadcastChannel("chat-room");
        if (roomId) {
            bc.postMessage({ type: "SET_ROOM", roomId });
        }

        if (roomId && currentUserId) {
            fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/chat/${roomId}/read`, {
                method: "POST",
            })
                .then(() => {
                    console.log(`✅ [ChatRoom] Room #${roomId} 읽음 처리 완료`);
                    setUnreadCounts((prev) => ({ ...prev, [roomId]: 0 }));
                })
                .catch((err) => console.error("❌ 읽음 처리 실패:", err));

            sendReadEvent(roomId, currentUserId);
        }

        return () => {
            // ✅ 방 나가면 열린 방 ID 초기화 (알림 다시 허용)
            setCurrentOpenRoomId(null);
            bc.postMessage({ type: "SET_ROOM", roomId: null });
            bc.close();
        };
    }, [roomId, currentUserId, setCurrentOpenRoomId, setUnreadCounts]);

    /** ✅ 스크롤 맨 아래로 이동 */
    const scrollToBottom = (smooth = false) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    };
    useEffect(() => {
        if (messages.length > 0) scrollToBottom(false);
    }, [messages]);

    useLayoutEffect(() => {
        if (inputWrapperRef.current) {
            setBottomPadding(inputWrapperRef.current.offsetHeight);
        }
    }, [previewImage, input]);

    /** ✅ 로그인 사용자 정보 */
    useEffect(() => {
        (async () => {
            try {
                const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/main`);
                const user = await res.json();
                setCurrentUserId(user.id);
                console.log("🙋 로그인 사용자 ID:", user.id);
            } catch (e) {
                console.error("❌ 사용자 정보 불러오기 실패:", e);
            }
        })();
    }, []);

    /** ✅ 채팅방 상품 정보 */
    useEffect(() => {
        (async () => {
            try {
                const res = await fetchWithAuth(
                    `${import.meta.env.VITE_API_URL}/api/chat/room/${roomId}/item`
                );
                const data: ItemInfo = await res.json();
                setItem(data);
            } catch (err) {
                console.error("❌ 상품 정보 불러오기 실패:", err);
            }
        })();
    }, [roomId]);

    /** ✅ 채팅 내역 불러오기 */
    useEffect(() => {
        if (!currentUserId) return;
        (async () => {
            try {
                const res = await fetchWithAuth(
                    `${import.meta.env.VITE_API_URL}/api/chat/room/${roomId}/messages`
                );
                const data: ServerMessage[] = await res.json();
                const formatted: ChatMsg[] = data.map((msg) => ({
                    id: msg.id,
                    content: msg.content,
                    mine: msg.senderId === currentUserId,
                    time: new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    rawTime: msg.createdAt,
                    type: msg.type as MessageType,
                    read: msg.read,
                }));
                setMessages(formatted);
            } catch (e) {
                console.error("❌ 채팅 내역 불러오기 실패:", e);
            }
        })();
    }, [roomId, currentUserId]);

    /** ✅ 실시간 메시지 수신 */
    useEffect(() => {
        if (!roomId || !currentUserId) return; // ✅ 조건: 유저ID 준비된 후에만 connect

        console.log("🔌 [ChatRoom] connect 실행, roomId =", roomId, "userId =", currentUserId);

        connect(
            roomId,
            (msg) => {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: msg.id,
                        content: msg.content,
                        mine: msg.senderId === currentUserId,
                        time: new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                        rawTime: msg.createdAt,
                        type: msg.type,
                        read: msg.read ?? false,
                    },
                ]);
                if (msg.senderId !== currentUserId) {
                    sendReadEvent(roomId, currentUserId!);
                }
            },
            (update) => setItem(update),
            (readEvent) => {
                setMessages((prev) =>
                    prev.map((m) =>
                        readEvent.readIds.includes(m.id) ? { ...m, read: true } : m
                    )
                );
                setUnreadCounts((prev) => ({
                    ...prev,
                    [readEvent.roomId]: 0,
                }));
            },
            () => sendReadEvent(roomId, currentUserId!),
            (error) => {
                console.warn("📡 STOMP 에러:", error);
                if (typeof error !== "string") {
                    const headers = error.headers as Record<string, string>;
                    if (headers.message?.includes("401")) {
                        openLogin();
                    }
                }
            }
        );

        return () => {
            //console.log("🔌 [ChatRoom] cleanup → disconnect()");
            disconnect();
        };
    }, [roomId, currentUserId]);

    /** ✅ 메시지 전송 */
    const handleSend = async () => {
        if (!currentUserId) {
            openLogin();
            return;
        }

        // 이미지 업로드
        if (previewFile) {
            const formData = new FormData();
            formData.append("file", previewFile);

            try {
                const res = await fetchWithAuth(
                    `${import.meta.env.VITE_API_URL}/api/chat/upload`,
                    { method: "POST", body: formData }
                );
                const data = await res.json();
                sendMessage(roomId, data.url, currentUserId, "IMAGE");
            } catch (err) {
                console.error("❌ 이미지 업로드 실패:", err);
            } finally {
                setPreviewImage(null);
                setPreviewFile(null);
            }
        }

        // 텍스트 메시지
        if (input.trim() !== "") {
            try {
                sendMessage(roomId, input, currentUserId, "TEXT");
                setInput(""); // 전송 후 비우기
            } catch (err) {
                console.error("❌ 메시지 전송 실패:", err);
                openLogin();
            }
        }
    };

    return (
        <div className="chat-container">
            {/* 상단 상품 정보 */}
            {item && (
                <div className="chat-room-item-header">
                    <img src={item.imageUrl} alt={item.title} className="chat-room-item-thumb" />
                    <div className="chat-room-item-info">
                        <div className="chat-room-item-price">{(item.price ?? item.currentPrice ?? 0).toLocaleString()}원</div>
                        <div className="chat-room-item-desc">{item.description}</div>
                    </div>
                </div>
            )}

            {/* 메시지 영역 */}
            <div className="chat-messages" style={{ paddingBottom: bottomPadding }}>
                {messages.map((m, i) => {
                    const msgDate = new Date(m.rawTime).toDateString();
                    const prevDate = i > 0 ? new Date(messages[i - 1].rawTime).toDateString() : null;
                    const showDivider = msgDate !== prevDate;

                    return (
                        <div key={m.id}>
                            {showDivider && (
                                <DateDivider
                                    date={new Date(m.rawTime).toLocaleDateString("ko-KR", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        weekday: "short",
                                    })}
                                />
                            )}

                            {m.type === "SYSTEM" ? (
                                <div className="chat-system-message">📢 {m.content}</div>
                            ) : (
                                <div className={`chat-bubble ${m.mine ? "mine" : "other"}`}>
                                    {m.type === "LOCATION_MAP" ? (
                                        <div
                                            className="location-map-preview"
                                            onClick={() => {
                                                const { lat, lng, address } = JSON.parse(m.content);
                                                window.open(
                                                    `https://map.kakao.com/link/map/${encodeURIComponent(address)},${lat},${lng}`,
                                                    "_blank"
                                                );
                                            }}
                                        >
                                            <img
                                                src={kakaomapIcon}
                                                alt="카카오맵"
                                                style={{ width: "28px", height: "28px" }}
                                            />
                                            <span style={{ color: "#007aff", fontWeight: "bold" }}>위치 보기</span>
                                        </div>
                                    ) : m.type === "IMAGE" ? (
                                        <img
                                            src={m.content}
                                            alt="chat-img"
                                            style={{ maxWidth: "200px", borderRadius: "8px" }}
                                        />
                                    ) : (
                                        m.content
                                    )}

                                    <div className="message-time">
                                        {m.time}
                                        {m.mine && (
                                            <span className="read-indicator">
                                                {m.read ? "✔읽음" : "안읽음"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* 입력창 */}
            <div className="chat-input-wrapper" ref={inputWrapperRef}>
                {previewImage && (
                    <div className="chat-preview">
                        <img src={previewImage} alt="미리보기" className="chat-preview-img" />
                        <button
                            className="chat-preview-close"
                            onClick={() => {
                                setPreviewImage(null);
                                setPreviewFile(null);
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                <div className="chat-input">
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                setPreviewFile(file);
                                setPreviewImage(URL.createObjectURL(file));
                            }
                        }}
                    />

                    <button className="icon-button" onClick={() => fileInputRef.current?.click()}>
                        <Image size={18} />
                    </button>

                    <button className="icon-button" onClick={() => setShowMap(true)}>
                        <MapPin size={18} />
                    </button>

                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="메시지를 입력하세요"
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    />
                    <button className="send-button" onClick={handleSend}>
                        전송
                    </button>
                </div>
            </div>

            {showMap && (
                <LocationPickerModal
                    onConfirm={(lat, lng, address) => {
                        const payload = JSON.stringify({ lat, lng, address });
                        sendMessage(roomId, payload, currentUserId!, "LOCATION_MAP");
                        setTimeout(() => {
                            sendMessage(roomId, address, currentUserId!, "LOCATION_TEXT");
                        }, 150);
                        setShowMap(false);
                    }}
                    onCancel={() => setShowMap(false)}
                />
            )}
        </div>
    );
}
