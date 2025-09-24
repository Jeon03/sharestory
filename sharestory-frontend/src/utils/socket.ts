// import SockJS from "sockjs-client";
// import Stomp, { Client, Message } from "stompjs";
// import { useAuth } from "../contexts/useAuth";
//
// let stompClient: Client | null = null;
//
// export function useChatSocket() {
//     const { openLogin } = useAuth();
//
//     const connect = (
//         roomId: number,
//         onMessage: (msg: any) => void
//     ) => {
//         const API_BASE = import.meta.env.VITE_API_URL;
//         const token = localStorage.getItem("accessToken");
//         const socket = new SockJS(`${API_BASE}/ws`);
//         stompClient = Stomp.over(socket) as Client;
//
//         stompClient.connect(
//             token ? { Authorization: `Bearer ${token}` } : {},
//             () => console.log("✅ STOMP 연결 성공"),
//             (error) => {
//                 console.error("❌ STOMP 연결 실패:", error);
//                 if (error?.headers?.message?.includes("401")) {
//                     alert("로그인이 만료되었습니다. 다시 로그인 후 채팅을 이용해주세요.");
//                     openLogin();
//                 }
//             }
//         );
//     };
//
//     return { connect };
// }
