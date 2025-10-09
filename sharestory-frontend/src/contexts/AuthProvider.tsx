import { useEffect, useState, useCallback } from "react";
import { AuthContext } from "./auth-context";
import Login from "../pages/Login";
import type { User } from "../types/user";

// ✅ 추가 import
import { registerFcmToken } from "../utils/fcm";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    const openLogin = () => {
        if (isLoginOpen) return;
        setIsLoginOpen(true);
    };

    const closeLogin = () => {
        setIsLoginOpen(false);
    };

    // ✅ 사용자 정보 새로 불러오기
    const refreshUser = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/main`, { credentials: "include" });
            if (res.ok) {
                const data: User = await res.json();
                setUser(data);
            } else {
                setUser(null);
            }
        } catch (err) {
            console.error("❌ Failed to fetch user info", err);
            setUser(null);
        }
    }, []);

    // ✅ 로그인 성공 시
    const handleLoginSuccess = () => {
        window.dispatchEvent(new Event("login-success"));
        refreshUser(); // 로그인 직후 유저 정보 갱신
    };

    useEffect(() => {
        const handler = () => openLogin();
        window.addEventListener("open-login", handler);
        return () => window.removeEventListener("open-login", handler);
    }, []);

    // ✅ 앱 시작 시 사용자 정보 불러오기
    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    // ✅ 🔥 로그인 상태가 바뀔 때 FCM 등록 시도
    useEffect(() => {
        // user가 null이거나 아직 인증되지 않은 상태면 skip
        if (!user || !user.id) {
            console.log("🚫 FCM 등록 생략 — 사용자 없음");
            return;
        }

        // ✅ 로그인된 사용자만 FCM 등록
        console.log("👤 로그인된 사용자 감지됨 → FCM 등록 시도");
        registerFcmToken();
    }, [user?.id]); // 👈 user.id만 감시하도록 수정

    return (
        <AuthContext.Provider value={{ openLogin, closeLogin, user, refreshUser }}>
            {children}
            <Login
                isOpen={isLoginOpen}
                onClose={() => {
                    closeLogin();
                    document.body.classList.remove("login-open");
                }}
                onLoginSuccess={handleLoginSuccess}
            />
        </AuthContext.Provider>
    );
}
