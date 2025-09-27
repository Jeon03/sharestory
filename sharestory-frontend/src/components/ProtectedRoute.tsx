import { Navigate } from "react-router-dom";
import type { User } from "../types/user";
import { useAuth } from "../contexts/useAuth";

export default function ProtectedRoute({
                                           user,
                                           isAuthLoading,
                                           children,
                                       }: {
    user: User | null;
    isAuthLoading: boolean;        // ✅ 추가
    children: React.ReactElement;
}) {
    const { openLogin } = useAuth();

    if (isAuthLoading) {
        // 아직 로그인 여부 확인 중 → 절대 리다이렉트 하지 않기
        return <div style={{ padding: 24 }}>로그인 확인 중...</div>;
    }

    if (!user) {
        // 확인이 끝났고, 로그인 안 된 상태
        openLogin();
        return <Navigate to="/" replace />;
    }

    return children;
}
