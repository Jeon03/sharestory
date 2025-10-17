import "../../css/community.css";
import { useNavigate, useLocation } from "react-router-dom";

export default function CommunitySidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const categories = [
        "전체", "맛집", "동네행사", "반려동물", "운동", "생활/편의",
        "분실/실종", "병원/약국", "고민/사연", "동네친구", "이사/시공",
        "주거/부동산", "교육", "취미", "동네사건사고", "동네풍경",
        "미용", "임신/육아", "일반"
    ];

    // 현재 선택된 카테고리 (URL 쿼리에서 가져옴)
    const currentCategory = new URLSearchParams(location.search).get("category") || "전체";

    /** ✅ 클릭 시 community 페이지로 이동하면서 category 쿼리 전달 */
    const handleCategoryClick = (cat: string) => {
        navigate(`/community?category=${encodeURIComponent(cat)}`);
    };

    return (
        <aside className="ss-community-sidebar">
            <h3>📚 카테고리</h3>
            <ul>
                {categories.map((cat) => (
                    <li
                        key={cat}
                        className={currentCategory === cat ? "active" : ""}
                        onClick={() => handleCategoryClick(cat)}
                    >
                        {cat}
                    </li>
                ))}
            </ul>
        </aside>
    );
}
