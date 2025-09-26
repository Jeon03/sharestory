import { createContext } from "react";

export interface AuthContextValue {
    openLogin: () => void;
    closeLogin: () => void;

}

// ❗ 컴포넌트 없음. 값(Context)과 타입만 export합니다.
export const AuthContext = createContext<AuthContextValue | null>(null);
