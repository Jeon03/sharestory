// OAuth2Redirect.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuth2Redirect({ onLogin }: { onLogin: () => Promise<void> }) {
    const navigate = useNavigate();


    useEffect(() => {
        (async () => {
            // ✅ 서버에서 로그인된 사용자 정보 갱신
            await onLogin();
            // ✅ 로그인 성공 후 홈으로 이동
            navigate("/", { replace: true });
        })();
    }, [onLogin, navigate]);

    return <p>로그인 처리 중...</p>;
}
