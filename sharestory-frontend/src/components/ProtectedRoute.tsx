import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import type { User } from "../types/user";
import { useAuth } from "../contexts/useAuth";

export default function ProtectedRoute({
                                           user,
                                           isAuthLoading,
                                           children,
                                       }: {
    user: User | null;
    isAuthLoading: boolean;
    children: React.ReactElement;
}) {
    const { openLogin } = useAuth();

    // ✅ useEffect는 컴포넌트 최상단에 두기
    useEffect(() => {
        if (!isAuthLoading && !user) {
            openLogin();
        }
    }, [isAuthLoading, user, openLogin]);

    // ✅ 아래에 조건부 렌더링 작성
    if (isAuthLoading) {
        return <div style={{ padding: 24 }}>로그인 상태 확인 중...</div>;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return children;
}