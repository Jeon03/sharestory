// src/utils/fetchWithAuth.ts
export async function fetchWithAuth(input: RequestInfo, init?: RequestInit) {
    const res = await fetch(input, { ...init, credentials: "include" });

    if (res.status === 401 || res.status === 403) {
        // 전역 이벤트로 AuthProvider → openLogin 실행
        window.dispatchEvent(new Event("open-login"));
        throw new Error("UNAUTHORIZED");
    }

    if (!res.ok) {
        throw new Error(`API 실패: ${res.status} ${res.statusText}`);
    }

    return res;
}
