import { getToken, onMessage } from "firebase/messaging";
import { messagingPromise } from "../firebase/init";
import { vapidKey } from "../firebase/config";
import { fetchWithAuth } from "../utils/fetchWithAuth";

async function registerSW() {
    if (!("serviceWorker" in navigator)) return null;
    try {
        const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        return reg;
    } catch (e) {
        console.error("ServiceWorker 등록 실패:", e);
        return null;
    }
}

export async function registerFcmToken() {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        console.warn("알림 권한이 허용되지 않았습니다.");
        return;
    }

    const messaging = await messagingPromise;
    if (!messaging) {
        console.warn("이 브라우저는 FCM을 지원하지 않습니다.");
        return;
    }

    const swReg = await registerSW();
    const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: swReg ?? undefined,
    });

    if (token) {
        console.log("✅ FCM Token:", token);
        await fetchWithAuth("/api/fcm/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        });
    } else {
        console.warn("토큰 발급 실패");
    }
}
