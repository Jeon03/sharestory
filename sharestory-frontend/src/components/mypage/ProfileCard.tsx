import "../../css/myPage.css";

interface ProfileCardProps {
    username: string;
    email: string;
    provider?: string;
    point?: number;
    totalTrades?: number;
    onChargeClick: () => void;
    onEditClick: () => void;
}

export default function ProfileCard({
                                        username,
                                        email,
                                        point = 0,
                                        totalTrades = 0,
                                        onChargeClick,
                                        onEditClick,
                                    }: ProfileCardProps) {
    return (
        <section className="mypage-profile-card">
            {/* 아바타 */}
            <div className="mypage-avatar">
                {/* 추후 프로필 이미지 있으면 <img src={userImage} alt="avatar" /> */}
            </div>

            {/* 기본 정보 */}
            <div className="mypage-profile-info">
                <h2 className="mypage-username">{username}</h2>
                <p className="mypage-email">{email}</p>
                <br/>
                <div className="mypage-profile-actions">
                    <button className="mypage-edit-btn" onClick={onEditClick}>
                        프로필 수정
                    </button>
                    <button className="mypage-charge-btn" onClick={onChargeClick}>
                        포인트 충전
                    </button>
                </div>
            </div>

            {/* 추가 정보 */}
            <div className="mypage-profile-extra">
                <div>
                    포인트<br />
                    <strong>{point.toLocaleString()} P</strong>
                </div>
                <div>
                    총 거래횟수<br />
                    <strong>{totalTrades.toLocaleString()}</strong>
                </div>
            </div>
        </section>
    );
}
