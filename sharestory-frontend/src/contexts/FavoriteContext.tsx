// src/contexts/FavoriteContext.tsx
import { createContext, useState } from "react";
import type { ReactNode } from "react";

interface FavoriteContextType {
    favorites: number[];
    addFavorite: (id: number) => void;
    removeFavorite: (id: number) => void;
    setFavorites: (ids: number[]) => void;
}

const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);

export function FavoriteProvider({ children }: { children: ReactNode }) {
    const [favorites, setFavoritesState] = useState<number[]>([]);

    const addFavorite = (id: number) =>
        setFavoritesState((prev) => [...new Set([...prev, id])]);

    const removeFavorite = (id: number) =>
        setFavoritesState((prev) => prev.filter((f) => f !== id));

    return (
        <FavoriteContext.Provider
            value={{ favorites, addFavorite, removeFavorite, setFavorites: setFavoritesState }}
        >
            {children}
        </FavoriteContext.Provider>
    );
}

export default FavoriteContext;
