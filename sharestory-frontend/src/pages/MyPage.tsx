import "../css/myPage.css";


import type { User } from "../types/user";

import {Link, Outlet} from "react-router-dom";

interface MyPageProps {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export default function MyPage({ user, setUser }: MyPageProps) {

    if (!user) {
        return <div className="mypage-container">로그인이 필요합니다.</div>;
    }

    return (
        <div className="mypage-container">
            {/* 사이드바 */}
            <aside className="mypage-sidebar">
                <h3>마이 페이지</h3>
                <div>
                    <h4>거래정보</h4>
                    <ul>
                        <li><Link to="/mypage">판매내역</Link></li>
                        <li><Link to="/mypage">구매내역</Link></li>
                        <li><Link to="/mypage">경매내역</Link></li>
                        <li><Link to="/mypage">관심상품</Link></li>
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
        </div>
    );
}
