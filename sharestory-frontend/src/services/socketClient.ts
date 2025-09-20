import SockJS from "sockjs-client";
import Stomp, { Client } from "stompjs";
import type { Message } from "stompjs";

let stompClient: Client | null = null;

export type MessageType = "TEXT" | "IMAGE" | "LOCATION_MAP" | "LOCATION_TEXT";

export interface ChatMessage {
    roomId: number;
    senderId: number;
    content: string;
    createdAt: string;
    type: MessageType;
}

export interface ItemUpdateMessage {
    roomId: number;
    id: number;
    title: string;
    price: number;
    imageUrl: string;
    description: string;
}

export const connect = (
    roomId: number,
    onMessage: (msg: ChatMessage) => void,
    onItemUpdate?: (item: ItemUpdateMessage) => void,
    onUnreadIncrease?: () => void
) => {
    const API_BASE = import.meta.env.VITE_API_URL;
    const socket = new SockJS(`${API_BASE}/ws`);
    stompClient = Stomp.over(socket) as Client;



    // ⚡ 반드시 connect 안에서 구독해야 함
    stompClient.connect({}, () => {
        console.log("✅ STOMP 연결 성공");



        // 채팅 메시지 구독
        stompClient!.subscribe(`/sub/chat/room/${roomId}`, (message: Message) => {
            try {
                const body: ChatMessage = JSON.parse(message.body);
                onMessage(body);

                // 내가 보낸 게 아니면 unread 증가
                const currentUserId = Number(localStorage.getItem("userId"));
                if (body.senderId !== currentUserId) {
                    onUnreadIncrease?.();
                }
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
    }, (error) => {
        console.error("❌ STOMP 연결 실패:", error);
    });
};

export const sendMessage = (
    roomId: number,
    content: string,
    senderId: number,
    type: MessageType = "TEXT"
) => {
    if (stompClient && stompClient.connected) {
        const payload: ChatMessage = {
            roomId,
            content,
            senderId,
            type,
            createdAt: new Date().toISOString(),
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
    onMessage: (msg: ChatMessage) => void
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

            // ✅ 연결이 완료된 뒤에만 구독 실행
            stompClient.subscribe(`/sub/chat/user/${userId}`, (message: Message) => {
                try {
                    const body: ChatMessage = JSON.parse(message.body);
                    console.log("📩 글로벌 새 메시지:", body);
                    onMessage(body);
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

