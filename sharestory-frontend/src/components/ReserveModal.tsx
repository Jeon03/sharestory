import { useEffect, useState } from "react";
import "../css/ReserveModal.css";
import api from "../api/axios";

interface ChatRoomInfo {
    roomId: number;
    buyerId: number;
    buyerName: string;
    lastMessage?: string;
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
                    {rooms.map((room) => (
                        <li
                            key={room.roomId}
                            className={selectedRoom === room.roomId ? "selected" : ""}
                            onClick={() => setSelectedRoom(room.roomId)}
                        >
                            {room.buyerName}{" "}
                            <span style={{ color: "black", fontSize: "0.9em", marginLeft:"20px"}}>
                                ( 최근 메세지: {room.lastMessage ?? "메시지 없음"} )
                            </span>
                        </li>
                    ))}
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
