import { createContext } from "react";
import type { User } from "../types/user"; // ✅ 기존 User 인터페이스 재사용

interface AuthContextType {
    openLogin: () => void;
    closeLogin: () => void;
    user: User | null;
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
    openLogin: () => {},
    closeLogin: () => {},
    user: null,
    refreshUser: async () => {},
});