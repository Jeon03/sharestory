import SockJS from "sockjs-client";
import Stomp, { Client, Frame } from "stompjs";
import type { Message } from "stompjs";

let stompClient: Client | null = null;

export type MessageType =
    | "TEXT"
    | "IMAGE"
    | "LOCATION_MAP"
    | "LOCATION_TEXT"
    | "SYSTEM";

interface SockJSOptions {
    transports?: string[];
    withCredentials?: boolean;
}

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

/** 안전 구독 함수 */
function safeSubscribe(destination: string, callback: (msg: Message) => void) {
    setTimeout(() => {
        if (stompClient?.connected) {
            stompClient.subscribe(destination, callback);
        } else {
            console.warn(`⚠️ STOMP not connected, subscribe skipped: ${destination}`);
        }
    }, 0);
}

/** 안전 메시지 전송 */
function safeSend(destination: string, body: unknown) {
    if (!stompClient) {
        console.warn("⚠️ STOMP 클라이언트 없음");
        return;
    }

    if (stompClient.connected) {
        try {
            stompClient.send(destination, {}, JSON.stringify(body));
        } catch (err) {
            console.error("❌ STOMP 전송 오류:", err);
        }
    } else {
        console.warn("⏳ STOMP 연결 안됨 → 전송 보류");
    }
}

/**특정 채팅방 연결 */
export const connect = (
    roomId: number,
    onMessage: (msg: ChatMessage) => void,
    onItemUpdate?: (item: ItemUpdateMessage) => void,
    onRead?: (event: ReadEvent) => void,
    onConnected?: () => void,
    onError?: (err: Frame | string) => void
) => {
    const API_BASE = import.meta.env.VITE_API_URL;

    const options: SockJSOptions = {
        transports: ["xhr-streaming", "xhr-polling"],
        withCredentials: true,
    };

    const socket = new SockJS(`${API_BASE}/ws-connect`, null, options);
    stompClient = Stomp.over(socket);

    stompClient.connect(
        {},
        () => {
            console.log("✅ STOMP 연결 성공");

            safeSubscribe(`/sub/chat/room/${roomId}`, (message: Message) => {
                try {
                    const body: ChatMessage = JSON.parse(message.body);
                    onMessage(body);
                } catch (err) {
                    console.error("❌ 메시지 파싱 실패:", err);
                }
            });

            if (onItemUpdate) {
                safeSubscribe(`/sub/chat/room/${roomId}/item`, (message: Message) => {
                    try {
                        onItemUpdate(JSON.parse(message.body));
                    } catch (err) {
                        console.error("❌ 상품 업데이트 파싱 실패:", err);
                    }
                });
            }

            if (onRead) {
                safeSubscribe(`/sub/chat/room/${roomId}/read`, (message: Message) => {
                    try {
                        onRead(JSON.parse(message.body));
                    } catch (err) {
                        console.error("❌ 읽음 이벤트 파싱 실패:", err);
                    }
                });
            }

            onConnected?.();
        },
        (error: string | Frame) => {
            console.error("❌22 STOMP 연결 실패:", error);

            const unauthorizedError: Frame = {
                command: "ERROR",
                headers: { message: "401 Unauthorized" },
                body: "",
            };

            onError?.(unauthorizedError);

            // 🚫 연결 객체도 초기화 → 재시도 방지
            if (stompClient?.connected) {
                // stompClient.disconnect(() => console.log("🛑 STOMP 연결 종료 (401)"));
            }
            stompClient = null; // ✅ 추가
        }
    );
};

/**읽음 이벤트 전송 */
export const sendReadEvent = (
    roomId: number,
    userId: number,
    readIds: number[] = []
) => {
    const payload: ReadEvent = { roomId, userId, readIds };
    safeSend("/pub/read", payload);
};

/**메시지 전송 */
export const sendMessage = (
    roomId: number,
    content: string,
    senderId: number,
    type: MessageType = "TEXT"
) => {
    const payload: ChatMessage = {
        id: 0,
        roomId,
        content,
        senderId,
        type,
        createdAt: new Date().toISOString(),
        read: false,
    };
    safeSend("/pub/message", payload);
};

/**연결 해제 */
export const disconnect = () => {
    if (stompClient?.connected) {
        stompClient.disconnect(() => console.log("🛑 STOMP 연결 해제"));
    }
};

/**글로벌(유저 단위) 구독 */
export const connectGlobal = (
    userId: number,
    onMessage: (msg: ChatMessage) => void,
    onUnreadIncrease?: (roomId: number) => void,
    onError?: (error: Frame | string) => void
) => {
    const API_BASE = import.meta.env.VITE_API_URL;
    const options: SockJSOptions = {
        transports: ["xhr-streaming", "xhr-polling"],
        withCredentials: true,
    };

    const socket = new SockJS(`${API_BASE}/ws-connect`, null, options);
    stompClient = Stomp.over(socket);

    stompClient.connect(
        {},
        () => {
            // console.log("🌍 글로벌 구독 연결 성공");

            safeSubscribe(`/sub/chat/user/${userId}`, (message: Message) => {
                try {
                    const body: ChatMessage = JSON.parse(message.body);
                    onMessage(body);
                    onUnreadIncrease?.(body.roomId);
                } catch (err) {
                    console.error("❌ 메시지 파싱 실패:", err);
                }
            });
        },
        (error: string | Frame) => {
            console.error("❌22 STOMP 연결 실패:", error);

            // 무조건 401 시스템 에러 Frame 생성
            const unauthorizedError: Frame = {
                command: "ERROR",
                headers: { message: "401 Unauthorized" },
                body: "",
            };

            onError?.(unauthorizedError);
        }
    );
};
