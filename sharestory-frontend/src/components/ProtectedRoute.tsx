import React from "react";
import { Navigate } from "react-router-dom";
import type { User } from "../types/user";
import { useAuth } from "../contexts/useAuth";

export default function ProtectedRoute({
                                           user,
                                           children,
                                       }: {
    user: User | null;
    children: React.ReactElement;
}) {
    const { openLogin } = useAuth();

    if (!user) {
        openLogin();
        return <Navigate to="/" replace />;
    }

    return children;
}
