import { useEffect, useState } from "react";
import "../../css/ChatRoomListPanel.css";
import { useChatContext } from "../../contexts/ChatContext";


interface ChatRoom {
    roomId: number;
    partnerName: string;
    itemTitle: string;
    lastMessage: string;
    updatedAt: string;
    itemThumbnail: string;
    itemPrice: number;
    unreadCount: number;
}

interface ChatRoomListProps {
    onRoomSelect: (roomId: number) => void;
    onRequireLogin?: () => void;
}

export default function ChatRoomList({ onRoomSelect, onRequireLogin  }: ChatRoomListProps) {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);

    const [loginPrompted, setLoginPrompted] = useState(false);
    const { setUnreadCounts } = useChatContext();
    const { unreadCounts, lastMessages } = useChatContext();


    useEffect(() => {
        (async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/rooms`, {
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();

                console.log("📩 전체 채팅방 목록:", data);

                // ✅ Context에 unreadCounts 반영
                const initialCounts: { [roomId: number]: number } = {};
                data.forEach((room: ChatRoom) => {
                    initialCounts[room.roomId] = room.unreadCount;
                });
                setUnreadCounts(initialCounts);
            }
        })();
    }, [setUnreadCounts]);


    useEffect(() => {
        async function fetchRooms() {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/rooms`, {
                    credentials: "include",
                });

                if (res.ok) {
                    const data = await res.json();
                    setRooms(data);
                    console.log("📩 전체 채팅방 목록:", data);
                } else if ((res.status === 401 || res.status === 403) && !loginPrompted) {
                    console.warn("⚠️ 인증 만료 → 채팅 닫고 로그인창 열기");
                    setLoginPrompted(true);
                    onRequireLogin?.();   // ✅ 부모(ChatSlider)에 알림
                } else {
                    console.error("❌ 채팅방 목록 불러오기 실패:", res.status);
                }
            } catch (err) {
                console.error("❌ 채팅방 목록 불러오기 에러:", err);
                if (!loginPrompted) {
                    setLoginPrompted(true);
                    onRequireLogin?.();   // ✅ 부모(ChatSlider)에 알림
                }
            }
        }

        fetchRooms();
    }, [onRequireLogin, loginPrompted]);

    // ✅ Context 변화 확인용 로그
    useEffect(() => {
        console.log("💡 ChatRoomList - lastMessages:", lastMessages);
        console.log("💡 ChatRoomList - unreadCounts:", unreadCounts);
    }, [lastMessages, unreadCounts]);

    // ✅ Context 정보로 실시간 업데이트 반영
    // Context → rooms 보정
    const enrichedRooms = rooms.map((room) => {
        const last = lastMessages[room.roomId]; // 숫자키 그대로 접근
        return {
            ...room,
            lastMessage: last ? last.content : room.lastMessage,
            updatedAt: last ? last.updatedAt : room.updatedAt,
            unreadCount: unreadCounts[room.roomId] ?? room.unreadCount,
        };
    });

    // ✅ updatedAt 기준 최신순 정렬
    const sortedRooms = [...enrichedRooms].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    // ✅ 메시지 표시 포맷
    const renderLastMessage = (msg: string) => {
        if (!msg) return "메시지 없음";
        if (msg.startsWith("http") && msg.includes("amazonaws")) return "[사진]";
        if (msg.startsWith("{") && msg.includes("lat") && msg.includes("lng")) return "[지도]";
        return msg;
    };

    return (
        <div className="chatroom-panel-body">
            {sortedRooms.length === 0 ? (
                <p className="empty-message">참여 중인 채팅방이 없습니다.</p>
            ) : (
                sortedRooms.map((room) => (
                    <div
                        key={room.roomId}
                        className="chatroom-item"
                        onClick={() => onRoomSelect(room.roomId)}
                    >
                        {/* 왼쪽 : 썸네일 + 정보 */}
                        <div className="chatroom-left">
                            <img src={room.itemThumbnail} alt="썸네일" className="chatroom-thumb" />
                            <div className="chatroom-info">
                                <div className="chatroom-title">{room.partnerName}님과의 채팅</div>
                                <div className="chatroom-item-title">{room.itemTitle}</div>
                                <div className="chatroom-price">{room.itemPrice.toLocaleString()}원</div>
                            </div>
                        </div>

                        {/* 오른쪽 : 마지막 메시지 + 시간 */}
                        <div className="chatroom-right">
                            <div className="chatroom-last">
                                {renderLastMessage(room.lastMessage)}
                            </div>
                            <div className="chatroom-time">
                                {new Date(room.updatedAt).toLocaleDateString("ko-KR", {
                                    month: "2-digit",
                                    day: "2-digit",
                                })}{" "}
                                {new Date(room.updatedAt).toLocaleTimeString("ko-KR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                                {room.unreadCount > 0 && (
                                    <span className="chat-unread-badge">{room.unreadCount}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
