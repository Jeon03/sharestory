import { useAuth } from "../contexts/useAuth";

export function useApiFetch() {
    const { openLogin } = useAuth();

    return async (url: string, options: RequestInit = {}) => {
        const res = await fetch(url, {
            credentials: "include",
            ...options,
        });

        if (res.status === 401) {
            alert("로그인이 만료되었습니다. 다시 로그인 후 이용해주세요.");
            openLogin(); // ✅ 로그인 모달 열기
            throw new Error("Unauthorized");
        }

        return res;
    };
}