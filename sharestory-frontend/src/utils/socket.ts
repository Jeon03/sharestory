import SockJS from "sockjs-client";
import Stomp, { Client, Frame } from "stompjs";
import type { Message } from "stompjs";
import { useAuth } from "../contexts/useAuth";
import type { ChatMessage } from "../services/socketClient.ts";

let stompClient: Client | null = null;

export function useChatSocket() {
    const { openLogin } = useAuth();

    const connect = (
        roomId: number,
        onMessage: (msg: ChatMessage) => void,
        onSystemMessage?: (msg: string) => void
    ) => {
        const API_BASE = import.meta.env.VITE_API_URL;
        const token = localStorage.getItem("accessToken");

        const socket = new SockJS(`${API_BASE}/ws`);
        stompClient = Stomp.over(socket) as Client;

        stompClient.connect(
            token ? { Authorization: `Bearer ${token}` } : {},
            () => {
                console.log("STOMP 연결 성공");

                // 채팅 메시지 구독
                stompClient!.subscribe(`/sub/chat/room/${roomId}`, (message: Message) => {
                    try {
                        const body: ChatMessage = JSON.parse(message.body);
                        onMessage(body);
                    } catch (err) {
                        console.error("❌ 메시지 파싱 실패:", err);
                    }
                });
            },
            (error: string | Frame) => {
                console.error("❌ STOMP 연결 실패:", error);

                if (typeof error !== "string" && "headers" in error) {
                    const headers = error.headers as Record<string, string>;
                    if (headers["message"]?.includes("401")) {
                        onSystemMessage?.("로그인이 만료되었습니다. 다시 로그인 후 채팅을 이용해주세요.");
                        openLogin();
                    }
                }
            }
        );
    };

    const disconnect = () => {
        if (stompClient && stompClient.connected) {
            //stompClient.disconnect(() => console.log("🛑 STOMP 연결 해제"));
        }
    };

    return { connect, disconnect };
}
