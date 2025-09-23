import "../css/myPage.css";
import { useState, useEffect } from "react";
import ProfileCard from "../components/mypage/ProfileCard";
import PointModal from "../components/PointModal";
import type { User } from "../types/user";
import MyItems from "../components/mypage/MyItems";

interface MyPageProps {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export default function MyPage({ user, setUser }: MyPageProps) {
    const [showPointModal, setShowPointModal] = useState(false);
    const [points, setPoints] = useState(user?.points ?? 0);

    useEffect(() => {
        if (user?.points !== undefined) {
            setPoints(user.points);
        }
    }, [user?.points]);

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
                        <li>판매내역</li>
                        <li>구매내역</li>
                        <li>경매내역</li>
                        <li>관심상품</li>
                    </ul>
                    <h4>내 정보</h4>
                    <ul>
                        <li>거래후기</li>
                        <li>탈퇴하기</li>
                    </ul>
                </div>
            </aside>

            {/* 메인 */}
            <main className="mypage-main">
                <ProfileCard
                    username={user.nickname}
                    email={user.email}
                    provider={user.role}
                    point={points}
                    totalTrades={0} // ✅ 추후 API에서 거래 횟수 불러오기
                    onChargeClick={() => setShowPointModal(true)}
                    onEditClick={() => alert("프로필 수정")}
                />

                <MyItems />
            </main>

            {/* 포인트 모달 */}
            <PointModal
                isOpen={showPointModal}
                onClose={() => setShowPointModal(false)}
                points={points}
                user={user}
                setPoints={(newBalance) => {
                    setPoints(newBalance);
                    setUser((prev: User | null) =>
                        prev ? { ...prev, points: newBalance } : prev
                    );
                }}
            />
        </div>
    );
}
