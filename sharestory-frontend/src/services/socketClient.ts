import SockJS from "sockjs-client";
import Stomp, { Client } from "stompjs";
import type { Message } from "stompjs";

let stompClient: Client | null = null;

export type MessageType = "TEXT" | "IMAGE" | "LOCATION_MAP" | "LOCATION_TEXT";

export interface ChatMessage {
    id: number;
    roomId: number;
    senderId: number;
    content: string;
    createdAt: string;
    type: MessageType;
    read?: boolean;
}

export interface ItemUpdateMessage {
    roomId: number;
    id: number;
    title: string;
    price: number;
    imageUrl: string;
    description: string;
}
export interface ReadEvent {
    roomId: number;
    userId: number;
    messageId?: number;
    readIds: number[];
}

export const connect = (
    roomId: number,
    onMessage: (msg: ChatMessage) => void,
    onItemUpdate?: (item: ItemUpdateMessage) => void,
    onRead?: (event: ReadEvent) => void,
    onConnected?: () => void
) => {
    const API_BASE = import.meta.env.VITE_API_URL;
    const socket = new SockJS(`${API_BASE}/ws`);
    stompClient = Stomp.over(socket) as Client;

    stompClient.connect({}, () => {
        console.log("✅ STOMP 연결 성공");

        // 채팅 메시지 구독
        stompClient!.subscribe(`/sub/chat/room/${roomId}`, (message: Message) => {
            try {
                const body: ChatMessage = JSON.parse(message.body);
                onMessage(body);
            } catch (err) {
                console.error("❌ 메시지 파싱 실패:", err);
            }
        });

        // 상품 업데이트 구독
        if (onItemUpdate) {
            stompClient!.subscribe(`/sub/chat/room/${roomId}/item`, (message: Message) => {
                try {
                    const body: ItemUpdateMessage = JSON.parse(message.body);
                    onItemUpdate(body);
                } catch (err) {
                    console.error("❌ 상품 업데이트 파싱 실패:", err);
                }
            });
        }

        if (onRead) {
            stompClient!.subscribe(`/sub/chat/room/${roomId}/read`, (message: Message) => {
                try {
                    const event: ReadEvent = JSON.parse(message.body);
                    console.log("📖 읽음 이벤트 수신:", event);
                    onRead(event);
                } catch (err) {
                    console.error("❌ 읽음 이벤트 파싱 실패:", err);
                }
            });
        }
        if (onConnected) {
            onConnected();
        }
    }, (error) => {
        console.error("❌ STOMP 연결 실패:", error);
    });
};

export const sendReadEvent = (roomId: number, userId: number, readIds: number[] = []) => {
    if (stompClient && stompClient.connected) {
        const payload: ReadEvent = { roomId, userId, readIds };
        console.log("📤 보내는 읽음 이벤트:", payload); // ✅ 로그 찍어보기
        stompClient.send("/pub/read", {}, JSON.stringify(payload));
    }
};

export const sendMessage = (
    roomId: number,
    content: string,
    senderId: number,
    type: MessageType = "TEXT"
) => {
    if (stompClient && stompClient.connected) {
        const payload: ChatMessage = {
            id: 0,
            roomId,
            content,
            senderId,
            type,
            createdAt: new Date().toISOString(),
            read: false,
        };
        stompClient.send("/pub/message", {}, JSON.stringify(payload));
    } else {
        console.warn("⚠️ STOMP 연결 안됨 → 메시지 전송 불가");
    }
};

export const disconnect = () => {
    if (stompClient && stompClient.connected) {
        stompClient.disconnect(() => console.log("🛑 STOMP 연결 해제"));
    }
};

export const connectGlobal = (
    userId: number,
    onMessage: (msg: ChatMessage) => void,
    onUnreadIncrease?: (roomId: number) => void
) => {
    const API_BASE = import.meta.env.VITE_API_URL;
    const socket = new SockJS(`${API_BASE}/ws`);
    stompClient = Stomp.over(socket) as Client;

    console.log("🌐 Opening WebSocket...");

    stompClient.connect(
        {},
        (frame) => {
            console.log("🌍 글로벌 구독 연결 성공:", frame);

            if (!stompClient || !stompClient.connected) {
                console.warn("⚠️ STOMP 연결이 아직 준비되지 않음");
                return;
            }

            // ✅ 유저 단위 글로벌 구독
            stompClient.subscribe(`/sub/chat/user/${userId}`, (message: Message) => {
                try {
                    const body: ChatMessage = JSON.parse(message.body);
                    console.log("📩 글로벌 새 메시지:", body);
                    onMessage(body);

                    // 현재 열려있지 않은 방 → unread 증가
                    onUnreadIncrease?.(body.roomId);
                } catch (err) {
                    console.error("❌ 글로벌 메시지 파싱 실패:", err);
                }
            });
        },
        (error) => {
            console.error("❌ 글로벌 STOMP 연결 실패:", error);
        }
    );
};

