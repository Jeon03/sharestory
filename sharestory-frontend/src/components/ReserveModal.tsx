import { useEffect, useState } from "react";
import "../css/ReserveModal.css";
import api from "../api/axios";

interface ChatRoomInfo {
    roomId: number;
    buyerId: number;
    buyerName: string;
    lastMessage?: string;
    lastMessageType?: "TEXT" | "IMAGE" | "LOCATION";
}

interface ReserveModalProps {
    itemId: number;
    onClose: () => void;
    onConfirm: (roomId: number, buyerId: number) => void;
}

export default function ReserveModal({ itemId, onClose, onConfirm }: ReserveModalProps) {
    const [rooms, setRooms] = useState<ChatRoomInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState<number | null>(null);

    // ✅ 채팅방 목록 불러오기
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await api.get<ChatRoomInfo[]>(`/items/${itemId}/chatrooms`);
                setRooms(res.data);

            } catch (err) {
                console.error("채팅방 목록 불러오기 실패", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRooms();
    }, [itemId]);

    if (loading) {
        return (
            <div className="reserve-modal-overlay">
                <div className="reserve-modal">로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="reserve-modal-overlay">
            <div className="reserve-modal">
                <h2>예약할 구매자 선택</h2>
                <ul>
                    {rooms.length === 0 ? (
                        <li className="mymodal-no-room">
                            예약할 구매자가 존재하지 않습니다.
                        </li>
                    ) : (
                        rooms.map((room) => {
                            // 메시지 표시 변환
                            let displayMessage = "메시지 없음";
                            if (room.lastMessage) {
                                if (room.lastMessageType === "IMAGE") {
                                    displayMessage = "[사진]";
                                } else if (room.lastMessageType === "LOCATION") {
                                    displayMessage = "[지도]";
                                } else if (room.lastMessageType === "TEXT") {
                                    displayMessage = room.lastMessage ?? "메시지 없음";
                                }
                            }

                            return (
                                <li
                                    key={room.roomId}
                                    className={`mymodal-chatroom-item ${
                                        selectedRoom === room.roomId ? "selected" : ""
                                    }`}
                                    onClick={() => setSelectedRoom(room.roomId)}
                                >
                                    <span>{room.buyerName}</span>
                                    <span className="mymodal-last-message">
                                    최근 메세지: {displayMessage}
                                </span>
                                </li>
                            );
                        })
                    )}
                </ul>

                <div className="reserve-modal-buttons">
                    <button className="cancel-btn" onClick={onClose}>
                        취소
                    </button>
                    <button
                        className="confirm-btn"
                        disabled={!selectedRoom}
                        onClick={() => {
                            const room = rooms.find((r) => r.roomId === selectedRoom);
                            if (room) {
                                onConfirm(room.roomId, room.buyerId); // 부모에게 전달
                            }
                        }}
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );

}
