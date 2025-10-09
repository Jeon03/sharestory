import fs from "fs";
import dotenv from "dotenv";

dotenv.config(); // .env 로드

const config = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const output = `self.firebaseConfig = ${JSON.stringify(config, null, 2)};`;

fs.writeFileSync("public/firebase-config.js", output);
console.log("✅ Firebase 설정 파일 생성 완료 → public/firebase-config.js");
