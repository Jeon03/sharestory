import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { connect, disconnect, sendMessage } from "../../services/socketClient";
import "../../css/chat.css";
import { Image, MapPin, X } from "lucide-react";
import LocationPickerModal from "../LocationPickerModal.tsx";
import kakaomapIcon from "../../images/kakaomap_basic.png";

interface ChatRoomProps {
    roomId: number;
    onBack: () => void;
}

interface ChatMsg {
    content: string;
    mine: boolean;
    time: string; // HH:mm
    rawTime: string; // ISO
    type: "TEXT" | "IMAGE" | "LOCATION_MAP" | "LOCATION_TEXT";
}

interface ItemInfo {
    id: number;
    title: string;
    price: number;
    imageUrl: string;
    description: string;
}

interface ServerMessage {
    roomId: number;
    senderId: number;
    content: string;
    type: "TEXT" | "IMAGE" | "LOCATION_MAP" | "LOCATION_TEXT";
    createdAt: string;
}

// 날짜 구분선
const DateDivider = ({ date }: { date: string }) => (
    <div className="chat-date-divider">{date}</div>
);

export default function ChatRoom({ roomId }: ChatRoomProps) {
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [input, setInput] = useState("");
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [item, setItem] = useState<ItemInfo | null>(null);

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [showMap, setShowMap] = useState(false); // ✅ 위치 모달 상태

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const inputWrapperRef = useRef<HTMLDivElement | null>(null);
    const [bottomPadding, setBottomPadding] = useState(80);

    // ✅ 입력창 높이 자동 반영
    useLayoutEffect(() => {
        if (inputWrapperRef.current) {
            setBottomPadding(inputWrapperRef.current.offsetHeight);
        }
    }, [previewImage, input]);

    // ✅ 로그인 사용자 정보
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

    // ✅ 채팅방 상품 정보
    useEffect(() => {
        async function fetchItem() {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/chat/room/${roomId}/item`,
                    { credentials: "include" }
                );
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

    // ✅ 채팅 내역
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
                        rawTime: msg.createdAt,
                        type: msg.type,
                    }));
                    setMessages(formatted);
                }
            } catch (e) {
                console.error("채팅 내역 불러오기 실패:", e);
            }
        })();
    }, [roomId, currentUserId]);

    // ✅ 실시간 메시지 수신
    useEffect(() => {
        if (!currentUserId) return;

        async function fetchItem() {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/chat/room/${roomId}/item`,
                    { credentials: "include" }
                );
                if (res.ok) {
                    const data: ItemInfo = await res.json();
                    setItem(data);
                }
            } catch (err) {
                console.error("상품 정보 즉시 갱신 실패:", err);
            }
        }

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
                    rawTime: msg.createdAt ?? new Date().toISOString(),
                    type: msg.type ?? "TEXT",
                },
            ]);
        },
            (update) => {
                setItem({
                    id: update.id,
                    title: update.title,
                    price: update.price,
                    imageUrl: update.imageUrl,
                    description: update.description,
                });
            }
        );
        fetchItem();
        return () => disconnect();
    }, [roomId, currentUserId]);

    // ✅ 메시지 전송
    const handleSend = async () => {
        if (!currentUserId) return;

        // 1️⃣ 이미지 업로드
        if (previewFile) {
            const formData = new FormData();
            formData.append("file", previewFile);

            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/upload`, {
                    method: "POST",
                    body: formData,
                    credentials: "include",
                });

                if (res.ok) {
                    const data = await res.json();
                    const imageUrl = data.url;
                    sendMessage(roomId, imageUrl, currentUserId, "IMAGE");
                }
            } catch (err) {
                console.error("이미지 업로드 실패:", err);
            } finally {
                setPreviewImage(null);
                setPreviewFile(null);
            }
        }

        // 2️⃣ 텍스트 메시지
        if (input.trim() !== "") {
            sendMessage(roomId, input, currentUserId, "TEXT");
            setInput("");
        }
    };

    // ✅ 파일 선택 핸들러
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreviewFile(file);
            setPreviewImage(URL.createObjectURL(file));
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
            <div className="chat-messages" style={{ paddingBottom: bottomPadding }}>
                {messages.map((m, i) => {
                    const msgDate = new Date(m.rawTime).toDateString();
                    const prevDate =
                        i > 0 ? new Date(messages[i - 1].rawTime).toDateString() : null;
                    const showDivider = msgDate !== prevDate;

                    return (
                        <div key={i}>
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
                            <div className={`chat-bubble ${m.mine ? "mine" : "other"}`}>
                                {m.type === "LOCATION_MAP" ? (
                                    // 지도 공유 미리보기
                                    <div
                                        className="location-map-preview"
                                        onClick={() => {
                                            const { lat, lng, address } = JSON.parse(m.content);
                                            window.open(
                                                `https://map.kakao.com/link/map/${encodeURIComponent(address)},${lat},${lng}`,
                                                "_blank"
                                            );
                                        }}
                                        style={{
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
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
                                    // ✅ 이미지 메시지 처리
                                    <img
                                        src={m.content}
                                        alt="chat-img"
                                        style={{ maxWidth: "200px", borderRadius: "8px" }}
                                    />
                                ) : (
                                    // 기본 텍스트 메시지
                                    m.content
                                )}
                                <div className="message-time">{m.time}</div>
                            </div>

                        </div>
                    );
                })}
            </div>

            {/* 입력창 + 미리보기 */}
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
                        onChange={handleFileChange}
                    />

                    <button className="icon-button" onClick={() => fileInputRef.current?.click()}>
                        <Image size={18} />
                    </button>

                    {/* ✅ 위치 공유 버튼 */}
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

            {/* ✅ 위치 선택 모달 */}
            {showMap && (
                <LocationPickerModal
                    onConfirm={(lat, lng, address) => {
                        const payload = JSON.stringify({ lat, lng, address });

                        // 지도 미리보기 메시지
                        sendMessage(roomId, payload, currentUserId!, "LOCATION_MAP");
                        // 주소 텍스트 메시지
                        sendMessage(roomId, address, currentUserId!, "LOCATION_TEXT");

                        setShowMap(false);
                    }}
                    onCancel={() => setShowMap(false)}
                />
            )}
        </div>
    );
}
