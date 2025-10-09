/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");
importScripts("/firebase-config.js"); // ✅ Firebase 설정 포함

firebase.initializeApp(self.firebaseConfig);
const messaging = firebase.messaging();

// 🔹 현재 React에서 보고 있는 채팅방 ID (BroadcastChannel 통해 갱신됨)
let activeRoomId = null;

// 🔹 React ↔ Service Worker 통신 채널
const bc = new BroadcastChannel("chat-room");
bc.onmessage = (event) => {
    if (event.data?.type === "SET_ROOM") {
        activeRoomId = event.data.roomId;
        console.log("📡 현재 열린 채팅방 ID:", activeRoomId);
    }
};

// ✅ 백그라운드 메시지 수신 시
messaging.onBackgroundMessage((payload) => {
    console.log("📩 백그라운드 메시지 수신:", payload);

    const { title, body, click_action, roomId } = payload.data || {};

    // 🚫 현재 열린 채팅방이면 알림 표시 생략
    if (activeRoomId && roomId && String(activeRoomId) === String(roomId)) {
        console.log(`🚫 채팅방(${roomId}) 열려 있음 → 알림 생략`);
        return;
    }

    // ✅ 알림 표시
    self.registration.showNotification(title || "새 메시지", {
        body: body || "",
        icon: "/icon-192.png",
        data: { click_action },
    });
});

//알림 클릭 시 동작
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const clickAction = event.notification.data?.click_action || "/";
    console.log("🖱 알림 클릭됨 →", clickAction);

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                // ✅ 이미 React 창이 열려 있다면 focus + 메시지 전송
                const client = clientList[0];
                client.focus();
                client.postMessage({
                    type: "OPEN_CHAT_SLIDER",
                    clickAction,
                });
            } else {
                // ✅ 닫혀 있으면 새 창 오픈
                clients.openWindow(clickAction.startsWith("/") ? clickAction : "/" + clickAction);
            }
        })
    );
});
