import { useEffect, useState, useCallback } from "react";
import { AuthContext } from "./auth-context";
import Login from "../pages/Login";
import type { User } from "../types/user";

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
            const res = await fetch(`${API_BASE}/main`, { credentials: "include" });
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
