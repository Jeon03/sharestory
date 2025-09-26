import { useEffect, useState } from "react";
import { AuthContext } from "./auth-context";
import Login from "../pages/Login";


// ❗ 이 파일은 오직 컴포넌트만 export 합니다.
export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    const openLogin = () => {
        if (isLoginOpen) return; // ✅ 중복 방지
        setIsLoginOpen(true);
    };

    const closeLogin = () => {
        setIsLoginOpen(false);
    };

    // ✅ 로그인 성공 시 호출되는 함수 (Login 컴포넌트에서 props로 내려주면 됨)
    const handleLoginSuccess = () => {
        window.dispatchEvent(new Event("login-success"));
    };

    useEffect(() => {
        const handler = () => openLogin();
        window.addEventListener("open-login", handler);
        return () => window.removeEventListener("open-login", handler);
    }, []);

    return (
        <AuthContext.Provider value={{ openLogin, closeLogin }}>
            {children}
            <Login
                isOpen={isLoginOpen}
                onClose={() => {
                    closeLogin(); // Safe wrapper
                    document.body.classList.remove("login-open"); // 닫으면 다시 열 수 있도록 해제
                }}
                onLoginSuccess={handleLoginSuccess}
            />
        </AuthContext.Provider>
    );
}
