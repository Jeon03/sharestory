import React from "react";
import ReactDOM from "react-dom/client";
import "./css/App.css";
import { BrowserRouter as Router } from "react-router-dom";

// ✅ Context Providers
import AuthProvider from "./contexts/AuthProvider";
import AppWithProviders from "./AppWithProviders"; // 👈 분리된 App 래퍼 import

// ✅ 앱 렌더링
ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Router>
            {/* 🔹 AuthProvider: 로그인 / 유저 정보 관리 */}
            <AuthProvider>
                {/* 🔹 내부에서 useAuth()로 user를 가져와 다른 Provider에 연결 */}
                <AppWithProviders />
            </AuthProvider>
        </Router>
    </React.StrictMode>
);
