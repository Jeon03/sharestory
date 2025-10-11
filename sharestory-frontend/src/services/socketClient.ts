import SockJS from "sockjs-client";
import Stomp, { Client, Frame} from "stompjs";
import type { NotificationPayload } from "../types/notification";
import type { Message } from "stompjs";

let stompClient: Client | null = null;

export type MessageType = "TEXT" | "IMAGE" | "LOCATION_MAP" | "LOCATION_TEXT" | "SYSTEM";

interface SockJSOptions {
    transports?: string[];
    withCredentials?: boolean;
}
// ✅ Frame 타입 확장 (headers에 string 인덱스 추가)
interface SafeFrame extends Frame {
    headers: Record<string, string>;
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

/* ----------------------------------
 * ✅ 안전 구독 (연결 완료될 때까지 재시도)
 * ---------------------------------- */
function safeSubscribe(destination: string, callback: (msg: Message) => void, retryCount = 0) {
    if (stompClient?.connected) {
        stompClient.subscribe(destination, callback);
        console.log(`✅ 구독 성공: ${destination}`);
        return;
    }

    if (retryCount > 10) {
        console.warn(`⚠️ ${destination} 구독 재시도 포기`);
        return;
    }

    console.warn(`⏳ STOMP 연결 대기 중... (${destination}) [retry=${retryCount}]`);
    setTimeout(() => safeSubscribe(destination, callback, retryCount + 1), 500);
}

/* ----------------------------------
 * ✅ 안전 전송
 * ---------------------------------- */
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

/* ----------------------------------
 * ✅ 특정 채팅방 연결
 * ---------------------------------- */
export const connect = (
    roomId: number,
    onMessage: (msg: ChatMessage) => void,
    onItemUpdate?: (item: ItemUpdateMessage) => void,
    onRead?: (event: ReadEvent) => void,
    onConnected?: () => void,
    onError?: (err: Frame | string) => void
) => {
    const API_BASE = import.meta.env.VITE_API_URL;
    const socket = new SockJS(`${API_BASE}/ws-connect`);
    stompClient = Stomp.over(socket);
    stompClient.debug = () => {}; // 콘솔 로그 끄기

    stompClient.connect(
        {},
        () => {
            console.log("✅ STOMP 연결 성공 (Chat)");

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
        (error) => {
            console.error("❌ STOMP 연결 실패:", error);
            onError?.(error);
            stompClient = null;
        }
    );
};

/* ----------------------------------
 * ✅ 읽음 이벤트 전송
 * ---------------------------------- */
export const sendReadEvent = (roomId: number, userId: number, readIds: number[] = []) => {
    const payload: ReadEvent = { roomId, userId, readIds };
    safeSend("/pub/read", payload);
};

/* ----------------------------------
 * ✅ 메시지 전송
 * ---------------------------------- */
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

/* ----------------------------------
 * ✅ 연결 해제
 * ---------------------------------- */
export const disconnect = () => {
    if (stompClient?.connected) {
        stompClient.disconnect(() => console.log("🛑 STOMP 연결 해제"));
    }
};

/* ----------------------------------
 * ✅ 글로벌 (유저 단위) 구독
 * ---------------------------------- */
export const connectGlobal = (
    userId: number,
    onMessage: (msg: ChatMessage) => void,
    onUnreadIncrease?: (roomId: number) => void,
    onError?: (error: Frame | string) => void
) => {
    const API_BASE = import.meta.env.VITE_API_URL;
    const socket = new SockJS(`${API_BASE}/ws-connect`);
    stompClient = Stomp.over(socket);
    stompClient.debug = () => {};

    stompClient.connect(
        {},
        () => {
            console.log("✅ STOMP 연결 성공 (Global)");
            safeSubscribe(`/sub/chat/user/${userId}`, (message: Message) => {
                try {
                    const body: ChatMessage = JSON.parse(message.body);
                    onMessage(body);
                    if (["SYSTEM", "TEXT", "IMAGE"].includes(body.type)) {
                        onUnreadIncrease?.(body.roomId);
                    }
                } catch (err) {
                    console.error("❌ 메시지 파싱 실패:", err);
                }
            });
        },
        (error) => {
            console.error("❌ Global STOMP 연결 실패:", error);
            onError?.(error);
        }
    );
};

/** 🔔 강화형 알림 구독 (자동 재연결 + 쿠키 인증 유지) */
export const connectNotifications = (
    onNotification: (data: NotificationPayload) => void,
    onError?: (error: Frame | string) => void
) => {
    const API_BASE = import.meta.env.VITE_API_URL;
    const options: SockJSOptions = {
        transports: ["xhr-streaming", "xhr-polling"],
        withCredentials: true,
    };

    // ✅ 이미 연결되어 있으면 재사용
    if (stompClient?.connected) {
        console.log("🔁 이미 STOMP 연결 중 (Notifications)");
        return stompClient;
    }

    const socket = new SockJS(`${API_BASE}/ws-connect`, null, options);
    stompClient = Stomp.over(socket);
    stompClient.debug = () => {}; // 콘솔 로그 제거

    let reconnectAttempts = 0;
    const MAX_RECONNECT = 5;

    const connectWithRetry = () => {
        stompClient?.connect(
            {},
            () => {
                console.log("✅ STOMP 연결 성공 (Notifications)");
                reconnectAttempts = 0;

                safeSubscribe("/user/queue/notifications", (message: Message) => {
                    try {
                        const data: NotificationPayload = JSON.parse(message.body);
                        console.log("🔔 새 알림 수신:", data);
                        onNotification(data);
                    } catch (err) {
                        console.error("❌ 알림 파싱 실패:", err);
                    }
                });
            },
            (error: Frame | string) => {
                console.error("❌ STOMP 알림 연결 실패:", error);

                // ✅ 타입 가드 + 확장된 SafeFrame 사용
                const isUnauthorized =
                    typeof error === "object" &&
                    error !== null &&
                    "headers" in error &&
                    (() => {
                        const frame = error as SafeFrame;
                        const msg = frame.headers["message"];
                        return typeof msg === "string" && msg.includes("401");
                    })();

                if (isUnauthorized) {
                    console.warn("🚫 STOMP 인증 실패 — 로그인 필요");
                    stompClient = null;
                    onError?.(error);
                    return;
                }

                // 🔁 네트워크 오류 등 → 재연결 시도
                if (reconnectAttempts < MAX_RECONNECT) {
                    const delay = Math.min(2000 * (reconnectAttempts + 1), 10000);
                    reconnectAttempts++;
                    console.warn(`🔄 ${reconnectAttempts}번째 STOMP 재연결 시도... (${delay}ms 후)`);
                    setTimeout(connectWithRetry, delay);
                } else {
                    console.error("❌ STOMP 최대 재연결 횟수 초과");
                    onError?.(error);
                }
            }
        );
    };

    connectWithRetry();
    return stompClient;
};
