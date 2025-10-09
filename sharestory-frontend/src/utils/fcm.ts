// src/utils/fcm.ts
import { getToken, onMessage } from "firebase/messaging";
import type { MessagePayload } from "firebase/messaging";
import { messagingPromise } from "../firebase/init";
import { vapidKey } from "../firebase/config";
import { fetchWithAuth } from "../utils/fetchWithAuth";

const API_BASE = import.meta.env.VITE_API_BASE || "";

//Service Worker 등록 함수
async function registerSW() {
    if (!("serviceWorker" in navigator)) {
        console.warn("❌ 브라우저가 Service Worker를 지원하지 않습니다.");
        return null;
    }

    try {
        console.log("🧩 Service Worker 등록 시도 중...");
        const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        console.log("✅ Service Worker 등록 성공:", reg);
        return reg;
    } catch (e) {
        console.error("❌ Service Worker 등록 실패:", e);
        return null;
    }
}

//FCM 등록 함수
export async function registerFcmToken() {
    console.log("🚀 FCM 등록 시작...");

    // 1️⃣ 알림 권한 요청
    const permission = await Notification.requestPermission();
    console.log("🔔 알림 권한 상태:", permission);

    if (permission !== "granted") {
        console.warn("⚠️ 알림 권한이 허용되지 않았습니다.");
        return;
    }

    //Messaging 객체 확인
    const messaging = await messagingPromise;
    console.log("📦 messaging 객체:", messaging);
    if (!messaging) {
        console.error("❌ FCM Messaging을 초기화할 수 없습니다. (브라우저 미지원)");
        return;
    }

    //서비스워커 등록
    const swReg = await registerSW();
    if (!swReg) {
        console.error("❌ Service Worker 등록 실패 → FCM 초기화 중단");
        return;
    }

    //토큰 발급 시도
    try {
        console.log("🔑 FCM 토큰 발급 시도 중...");
        const token = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: swReg,
        });

        if (!token) {
            console.warn("⚠️ getToken()이 null을 반환했습니다. 알림 권한 또는 SW 문제일 수 있습니다.");
            return;
        }

        console.log("✅ FCM Token 발급 성공:", token);
        localStorage.setItem("fcmToken", token);

        //서버 전송 (401 방지 옵션 추가)
        try {
            await fetchWithAuth(
                `${API_BASE}/api/fcm/token`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                },
                { handleAuthError: false } // 👈 401일 때 로그인 모달 띄우지 않음
            );
            console.log("📡 서버에 FCM 토큰 등록 요청 완료");
        } catch (err) {
            console.warn("⚠️ 서버 전송 실패 (무시 가능):", err);
        }
    } catch (err) {
        console.error("❌ FCM 토큰 발급 중 오류 발생:", err);
    }

    //포그라운드 알림 수신 (테스트용)
    onMessage(messaging, (payload: MessagePayload) => {
        console.log("📩 Foreground 메시지 수신:", payload);
        const title = payload.notification?.title || payload.data?.title || "새 알림";
        const body = payload.notification?.body || payload.data?.body || "";
        new Notification(title, { body });
    });
}
