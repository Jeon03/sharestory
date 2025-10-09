let isAuthPromptVisible = false;

export async function fetchWithAuth(
    input: RequestInfo,
    init?: RequestInit,
    options?: { handleAuthError?: boolean } // ✅ 세 번째 인자 추가
) {
    const { handleAuthError = true } = options || {};

    const res = await fetch(input, { ...init, credentials: "include" });

    // ✅ 인증 오류 처리
    if ((res.status === 401 || res.status === 403) && handleAuthError) {
        if (!isAuthPromptVisible) {
            isAuthPromptVisible = true;
            // 전역 이벤트로 AuthProvider → openLogin 실행
            window.dispatchEvent(new Event("open-login"));

            // 중복 방지 (5초간)
            setTimeout(() => (isAuthPromptVisible = false), 5000);
        }

        throw new Error("UNAUTHORIZED");
    }

    if (!res.ok) {
        throw new Error(`API 실패: ${res.status} ${res.statusText}`);
    }

    return res;
}
