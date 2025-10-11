import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCommunityPosts } from '../services/communityApi';
import { useAuth } from '../contexts/useAuth';
import LocationModal from '../components/LocationModal'; // ✅ 위치 설정 모달 import
import '../css/CommunityPage.css';
import { MessageSquare, ThumbsUp, Eye } from 'lucide-react';

// Post 타입 정의
interface Post {
    id: number;
    authorNickname: string;
    category: string;
    title: string;
    content: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    createdAt: string;
}

// 시간 포맷팅 함수
const formatTimeAgo = (dateStr: string): string => {
    const created = new Date(dateStr).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - created);
    const min = Math.floor(diffMs / 60000);
    if (min < 60) return `${min}분 전`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}시간 전`;
    const day = Math.floor(hr / 24);
    return `${day}일 전`;
};

export default function CommunityPage() {
    // ✅ useAuth에서 user와 함께 refreshUser 함수도 가져옵니다.
    const { user, refreshUser } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // ✅ 위치 설정 모달의 열림/닫힘 상태를 관리합니다.
    const [showLocationModal, setShowLocationModal] = useState(false);

    useEffect(() => {
        // user 정보가 로드될 때까지 기다립니다.
        if (user === null) {
            return;
        }

        const fetchPosts = async () => {
            // ✅ 사용자 위치 정보가 없으면, 모달을 띄우고 게시글 로딩을 중단합니다.
            if (!user.myLatitude || !user.myLongitude) {
                setShowLocationModal(true);
                setIsLoading(false);
                return;
            }

            try {
                const data = await getCommunityPosts({
                    lat: user.myLatitude,
                    lon: user.myLongitude,
                });
                setPosts(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPosts();
    }, [user]); // user 상태가 변경될 때마다 이 useEffect가 다시 실행됩니다.

    // ✅ 로딩 중일 때 표시할 UI
    if (isLoading) {
        return <div className="community-container">로딩 중...</div>;
    }

    return (
        <>
            {/* ✅ 위치 설정 모달 컴포넌트 렌더링 */}
            <LocationModal
                isOpen={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onSaveSuccess={() => {
                    setShowLocationModal(false);
                    refreshUser(); // 위치 저장이 성공하면, 업데이트된 user 정보를 다시 불러옵니다.
                }}
            />

            <div className="community-container">
                <header className="community-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h1>동네생활</h1>
                        {/* ✅ 동네 변경 버튼. 위치 정보가 있을 때만 표시합니다. */}
                        {user?.myLatitude && (
                            <button onClick={() => setShowLocationModal(true)} className="change-location-btn">
                                동네 변경
                            </button>
                        )}
                    </div>
                    <Link to="/community/write" className="write-button">글쓰기</Link>
                </header>
                <main>
                    {/* ✅ 위치 정보가 설정되지 않았을 때는 목록을 보여주지 않습니다. */}
                    {!user?.myLatitude || !user?.myLongitude ? (
                        <p>내 동네를 설정하고 이웃들의 이야기를 확인해보세요.</p>
                    ) : posts.length === 0 ? (
                        <p>주변에 작성된 게시글이 없습니다. 첫 글을 작성해보세요!</p>
                    ) : (
                        <ul className="post-list">
                            {posts.map(post => (
                                <li key={post.id} className="post-card">
                                    <Link to={`/community/posts/${post.id}`}>
                                        <span className="post-category">{post.category}</span>
                                        <h3 className="post-title">{post.title}</h3>
                                        <p className="post-content">{post.content}</p>
                                        <div className="post-meta">
                                            <span>{post.authorNickname}</span>
                                            <span>·</span>
                                            <span>{formatTimeAgo(post.createdAt)}</span>
                                        </div>
                                        <div className="post-stats">
                                            <span title="좋아요"><ThumbsUp size={14} /> {post.likeCount}</span>
                                            <span title="댓글"><MessageSquare size={14} /> {post.commentCount}</span>
                                            <span title="조회수"><Eye size={14} /> {post.viewCount}</span>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </main>
            </div>
        </>
    );
}