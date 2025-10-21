import { useEffect, useState } from "react";
import styles from "../css/CategoryAutoSuggest.module.css";

type CategoryOption = {
    key: string;
    label: string;
};

type Props = {
    title: string;
    onSelect: (key: string) => void;
};

const categoryOptions: CategoryOption[] = [
    { key: "digital", label: "디지털기기" },
    { key: "appliance", label: "생활가전" },
    { key: "furniture", label: "가구/인테리어" },
    { key: "living_kitchen", label: "생활/주방" },
    { key: "kids", label: "유아동" },
    { key: "kids_books", label: "유아도서" },
    { key: "womens_clothing", label: "여성의류" },
    { key: "womens_accessories", label: "여성잡화" },
    { key: "mens_fashion", label: "남성패션/잡화" },
    { key: "beauty", label: "뷰티/미용" },
    { key: "sports", label: "스포츠/레저" },
    { key: "hobby", label: "취미/게임/음반" },
    { key: "books", label: "도서" },
    { key: "ticket", label: "티켓/교환권" },
    { key: "processed_food", label: "가공식품" },
    { key: "health", label: "건강기능식품" },
    { key: "pet", label: "반려동물용품" },
    { key: "plant", label: "식물" },
    { key: "others", label: "기타 중고물품" },
    { key: "buying", label: "삽니다" },
];

export default function CategoryAutoSuggest({ title, onSelect }: Props) {
    const [suggestedKey, setSuggestedKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const API_BASE = import.meta.env.VITE_API_BASE || "";

    useEffect(() => {
        if (!title || title.trim().length < 2) {
            setSuggestedKey(null);
            return;
        }

        setLoading(true);
        const delay = setTimeout(async () => {
            try {
                const res = await fetch(
                    `${API_BASE}/api/category/suggest?title=${encodeURIComponent(title)}`,
                    { credentials: "include" }
                );
                if (!res.ok) throw new Error("서버 응답 실패");
                const key = await res.text();
                setSuggestedKey(key.trim());
            } catch (err) {
                console.error("❌ 추천 카테고리 요청 실패:", err);
                setSuggestedKey(null);
            } finally {
                setLoading(false);
            }
        }, 3000);

        return () => clearTimeout(delay);
    }, [title]);

    const label = categoryOptions.find((opt) => opt.key === suggestedKey)?.label;

    if (loading) {
        return <p className={styles["ss-suggest-loading"]}>카테고리 분석 중...</p>;
    }

    if (!suggestedKey || !label) return null;

    return (
        <div className={styles["ss-suggest-box"]}>
            🔍 <b className={styles["ss-suggest-label"]}>추천 카테고리:</b>{" "}
            <button
                type="button"
                className={styles["ss-suggest-button"]}
                onClick={() => onSelect(suggestedKey)}
            >
                {label}
            </button>
        </div>
    );
}
