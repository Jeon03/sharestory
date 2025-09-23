import { useEffect, useState } from "react";
import { AuthContext } from "./auth-context";
import Login from "../pages/Login";

// ❗ 이 파일은 오직 컴포넌트만 export 합니다.
export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    const openLogin = () => setIsLoginOpen(true);
    const closeLogin = () => setIsLoginOpen(false);

    useEffect(() => {
        const handler = () => openLogin();
        window.addEventListener("open-login", handler);
        return () => window.removeEventListener("open-login", handler);
    }, []);

    return (
        <AuthContext.Provider value={{ openLogin, closeLogin }}>
            {children}
            <Login isOpen={isLoginOpen} onClose={closeLogin} />
        </AuthContext.Provider>
    );
}
