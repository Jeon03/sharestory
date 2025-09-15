import { useEffect, useState } from "react";
import "../../css/ChatRoomListPanel.css";

interface ChatRoom {
    roomId: number;
    partnerName: string;
    itemTitle: string;
    lastMessage: string;
    updatedAt: string;
    itemThumbnail: string;
    itemPrice: number;
}

interface ChatRoomListProps {
    onRoomSelect: (roomId: number) => void;
}

export default function ChatRoomList({ onRoomSelect }: ChatRoomListProps) {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);

    useEffect(() => {
        async function fetchRooms() {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/rooms`, {
                    credentials: "include",
                });
                if (res.ok) {
                    const data = await res.json();
                    setRooms(data);
                }
            } catch (err) {
                console.error("채팅방 목록 불러오기 실패:", err);
            }
        }
        fetchRooms();
    }, []);

    const sortedRooms = [...rooms].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

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
                            <img
                                src={room.itemThumbnail}
                                alt="썸네일"
                                className="chatroom-thumb"
                            />
                            <div className="chatroom-info">
                                <div className="chatroom-title">
                                    {room.partnerName}님과의 채팅
                                </div>
                                <div className="chatroom-item-title">{room.itemTitle}</div>
                                <div className="chatroom-price">
                                    {room.itemPrice.toLocaleString()}원
                                </div>
                            </div>
                        </div>

                        {/* 오른쪽 : 마지막 메시지 + 시간 */}
                        <div className="chatroom-right">
                            <div className="chatroom-last">
                                {room.lastMessage || "메시지 없음"}
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
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
