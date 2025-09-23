import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "./auth-context";

// ❗ 이 파일은 컴포넌트가 전혀 없습니다(훅만 export).
export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
