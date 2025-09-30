import { initializeApp } from "firebase/app";
// --- [수정] --- onMessage와 MessagePayload를 import에 추가합니다.
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import type { MessagePayload } from "firebase/messaging";
import { fetchWithAuth } from "../utils/fetchWithAuth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

initializeApp(firebaseConfig);
const messaging = getMessaging();

export const requestPermissionAndRegisterToken = async () => {
    console.log("🔔 푸시 알림 권한을 요청합니다...");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        console.log("🔕 사용자가 푸시 알림을 거부했습니다.");
        return;
    }

    try {
        const currentToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });

        if (currentToken) {
            console.log("✅ FCM 토큰 발급 성공:", currentToken);
            await fetchWithAuth(`${import.meta.env.VITE_API_BASE}/fcm/save-token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: currentToken }),
            });
            console.log("🚀 FCM 토큰을 서버에 성공적으로 등록했습니다.");
        } else {
            console.log("❌ FCM 토큰을 발급받지 못했습니다. 권한을 확인해주세요.");
        }
    } catch (err) {
        console.error("❌ FCM 토큰 처리 중 오류 발생:", err);
    }
};

// --- [추가] --- 앱이 포그라운드에 있을 때 메시지를 처리하는 리스너를 설정하는 함수
export const setupForegroundMessageHandler = (handler: (payload: MessagePayload) => void) => {
    onMessage(messaging, (payload) => {
        console.log("✅ 포그라운드 메시지 수신:", payload);
        handler(payload);
    });
};