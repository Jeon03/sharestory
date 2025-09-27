// src/contexts/useFavorites.ts
import { useContext } from "react";
import FavoriteContext from "./FavoriteContext";

export function useFavorites() {
    const ctx = useContext(FavoriteContext);
    if (!ctx) throw new Error("useFavorites must be used within FavoriteProvider");
    return ctx;
}
