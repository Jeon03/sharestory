import { useState, useEffect } from 'react';
import type { ProductItem } from '../types/product';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const locationCache = new Map<string, string>();

const fetchRegionName = async (lat: number, lng: number): Promise<string> => {
    const key = `${lat},${lng}`;
    if (locationCache.has(key)) return locationCache.get(key)!;

    try {
        const res = await fetch(`${API_BASE}/map/region?lat=${lat}&lng=${lng}`, { credentials: 'include' });
        if (!res.ok) return '위치 정보 없음';
        const data = await res.json();
        const loc = data.documents?.[0]?.region_3depth_name || '위치 정보 없음';
        locationCache.set(key, loc);
        return loc;
    } catch (error) {
        console.error("위치 정보 조회 실패:", error);
        return '위치 정보 없음';
    }
};

const fetchItemsWithLocation = async (path: string): Promise<ProductItem[]> => {
    const fullUrl = `${API_BASE}${path}`;
    const res = await fetch(fullUrl, { credentials: 'include' });
    if (!res.ok) throw new Error(`${fullUrl} 로딩 실패`);
    const data: ProductItem[] = await res.json();

    return await Promise.all(
        data.map(async (item) => {
            if (item.latitude && item.longitude) {
                const location = await fetchRegionName(item.latitude, item.longitude);
                return { ...item, location };
            }
            return { ...item, location: '위치 정보 없음' };
        })
    );
};

export function useProductLists() {
    const [latestItems, setLatestItems] = useState<ProductItem[]>([]);
    const [favorites, setFavorites] = useState<ProductItem[]>([]);
    const [views, setViews] = useState<ProductItem[]>([]);
    const [allItems, setAllItems] = useState<ProductItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                const [latest, fav, view, all] = await Promise.all([
                    fetchItemsWithLocation(`/items/sorted/latest`),
                    fetchItemsWithLocation(`/items/sorted/favorites`),
                    fetchItemsWithLocation(`/items/sorted/views`),
                    fetchItemsWithLocation(`/allItems`),
                ]);

                setLatestItems(latest.slice(0, 12));
                setFavorites(fav.slice(0, 12));
                setViews(view.slice(0, 12));
                setAllItems(all);
            } catch (err) {
                console.error('[API] 상품 로드 실패:', err);
                setError("상품 정보를 불러오는 데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    return { latestItems, favorites, views, allItems, loading, error };
}