import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";
import { firebaseConfig } from "./config";

export const firebaseApp = initializeApp(firebaseConfig);

// 브라우저가 지원하면 메시징 객체 생성
export const messagingPromise = isSupported().then((supported) =>
    supported ? getMessaging(firebaseApp) : null
);
