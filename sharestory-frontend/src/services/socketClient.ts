import SockJS from "sockjs-client";
import Stomp, { Client } from "stompjs";
import type { Message } from "stompjs";

let stompClient: Client | null = null;

// 모든 메시지 타입 정의
export type MessageType = "TEXT" | "IMAGE" | "LOCATION_MAP" | "LOCATION_TEXT";

export interface ChatMessage {
    roomId: number;
    senderId: number;
    content: string;
    createdAt: string;
    type: MessageType;   // ✅ 확장된 타입
}

// 메시지 페이로드 (프론트 → 서버 전송용)
export interface ChatMessagePayload {
    roomId: number;
    content: string;
    type: MessageType;
}

export const connect = (
    roomId: number,
    onMessage: (msg: ChatMessage) => void
) => {
    const API_BASE = import.meta.env.VITE_API_URL;
    const socket = new SockJS(`${API_BASE}/ws`);
    stompClient = Stomp.over(socket) as Client;

    stompClient.connect(
        {},
        () => {
            if (!stompClient) return;

            if (stompClient.connected) {
                stompClient.subscribe(`/sub/chat/room/${roomId}`, (message: Message) => {
                    try {
                        const body: ChatMessage = JSON.parse(message.body);
                        onMessage(body);
                    } catch (err) {
                        console.error("❌ 메시지 파싱 실패:", err);
                    }
                });
                console.log("✅ STOMP connected");
            } else {
                console.warn("⚠️ STOMP not connected yet, subscribe skipped");
            }
        },
        (error) => {
            console.error("❌ STOMP connection error:", error);
        }
    );
};

export const sendMessage = (
    roomId: number,
    content: string,
    senderId: number,
    type: MessageType = "TEXT"   // 기본값: TEXT
) => {
    if (stompClient && stompClient.connected) {
        const payload: ChatMessage = {
            roomId,
            content,
            senderId,
            type,
            createdAt: new Date().toISOString(), // 서버 저장용
        };
        stompClient.send("/pub/message", {}, JSON.stringify(payload));
    }
};

export const disconnect = () => {
    if (stompClient && stompClient.connected) {
        stompClient.disconnect(() => {
            console.log("🔌 STOMP disconnected");
        });
    } else {
        console.warn("⚠️ STOMP client is not connected, skip disconnect");
    }
};
