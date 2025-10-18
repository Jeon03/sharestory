import "../css/myPage.css";
import { useState } from "react";
import type { User } from "../types/user";
//물품등록 ui
import {Link, Outlet} from "react-router-dom";
import FavoriteSlider from "../components/favorite/FavoriteSlider.tsx";

interface MyPageProps {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}
//test
export default function MyPage({ user, setUser }: MyPageProps) {

    const [isFavoriteOpen, setFavoriteOpen] = useState(false);

    if (!user) {
        return <div className="mypage-container">로그인이 필요합니다.</div>;
    }

    return (
        <div className="mypage-container">

            <aside className="mypage-sidebar">
                <h3>마이 페이지</h3>
                <div>
                    <h4>거래정보</h4>
                    <ul>
                        <li><Link to="/mypage/items">판매내역</Link></li>
                        <li><Link to="/mypage">구매내역</Link></li>
                        <li><Link to="/mypage">경매내역</Link></li>
                        <li
                            onClick={() => setFavoriteOpen(true)}
                            style={{ cursor: "pointer" }}
                        >
                            관심상품
                        </li>
                        <li><Link to="/mypage/points">포인트내역</Link></li>
                    </ul>
                    <h4>내 정보</h4>
                    <ul>
                        <li><Link to="/mypage/review">거래후기</Link></li>
                        <li><Link to="/mypage/withdraw">탈퇴하기</Link></li>
                    </ul>
                </div>
            </aside>

            {/* 메인 영역: Outlet으로 교체 */}
            <main className="mypage-main">
                <Outlet context={{ user, setUser }} />
            </main>
            {/* 관심상품 슬라이더 */}
            <FavoriteSlider
                isOpen={isFavoriteOpen}
                onClose={() => setFavoriteOpen(false)}
            />
        </div>
    );
}
