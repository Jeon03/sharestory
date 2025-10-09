import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
import type { Messaging } from "firebase/messaging";
import { firebaseConfig } from "./config";

export const firebaseApp = initializeApp(firebaseConfig);

export const messagingPromise: Promise<Messaging | null> = (async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return null;
    try {
        const messaging = getMessaging(firebaseApp);
        return messaging;
    } catch (err) {
        console.error("🔥 Firebase Messaging 초기화 실패:", err);
        return null;
    }
})();