import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { writeFileSync } from "node:fs";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const generateFirebaseConfig = {
  name: "generate-firebase-config",
  buildStart() {
    const config = {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID,
      measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
      vapidKey: process.env.VITE_FIREBASE_VAPID_KEY,
    };

    try {
      // ✅ JSON 대신 JS 파일로 작성
      writeFileSync(
          "public/firebase-config.js",
          `self.firebaseConfig = ${JSON.stringify(config, null, 2)};`
      );
      console.log("✅ firebase-config.js 생성 완료");
    } catch (err) {
      console.error("❌ firebase-config.js 생성 실패:", err);
    }
  },
};

export default defineConfig({
  plugins: [react(), generateFirebaseConfig],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
  server: {
    proxy: {
      "/api": { target: "http://localhost:8081", changeOrigin: true },
      "/auth": { target: "http://localhost:8081", changeOrigin: true },
      "/oauth2": { target: "http://localhost:8081", changeOrigin: true },
      "/login": { target: "http://localhost:8081", changeOrigin: true },
      "/logout": { target: "http://localhost:8081", changeOrigin: true },
      "/ws": { target: "http://localhost:8081", changeOrigin: true, ws: true },
      "/ws-connect": {
        target: "http://localhost:8081",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  define: {
    global: "window",
  },
});

