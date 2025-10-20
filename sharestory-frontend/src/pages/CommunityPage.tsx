//위치정보 추가중


import { useEffect, useState } from 'react';




import { Link } from 'react-router-dom';
import { getCommunityPosts } from '../services/communityApi';
import { useAuth } from '../contexts/useAuth';
import LocationModal from '../components/LocationModal';
import '../css/CommunityPage.css';
import { MessageSquare, ThumbsUp, Eye, Pencil } from 'lucide-react';

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
    imageUrl?: string; // 이미지 URL은 선택적
}

const CATEGORIES = ['전체보기', '동네질문', '일상', '맛집', '분실/실종', '동네소식'];

const formatTimeAgo = (dateStr: string): string => {
    const created = new Date(dateStr).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - created);
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return '방금 전';
    if (min < 60) return `${min}분 전`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}시간 전`;
    const day = Math.floor(hr / 24);
    return `${day}일 전`;
};

export default function CommunityPage() {
    // ✅ [누락된 부분 1] 상태 변수 선언
    const { user, refreshUser } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('전체보기');

    // ✅ [누락된 부분 2] 데이터 로딩 로직 (useEffect)
    useEffect(() => {
        if (user === null) {
            return; // 사용자 정보 로딩 중
        }

        const fetchPosts = async () => {
            if (!user.myLatitude || !user.myLongitude) {
                setShowLocationModal(true);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const data = await getCommunityPosts(
                    { lat: user.myLatitude, lon: user.myLongitude },
                    selectedCategory
                );
                setPosts(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPosts();
    }, [user, selectedCategory]);

    if (isLoading && user === null) {
        return <div className="community-container">사용자 정보를 불러오는 중...</div>;
    }

    return (
        <>
            <LocationModal
                isOpen={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onSaveSuccess={() => {
                    setShowLocationModal(false);
                    refreshUser();
                }}
            />
            <div className="community-container">
                <header className="community-header">
                    <h1>동네생활</h1>
                    {user?.myLatitude && (
                        <button onClick={() => setShowLocationModal(true)} className="change-location-btn">
                            내 동네: {user.addressName} (변경)
                        </button>
                    )}
                </header>

                <div className="community-main-content">
                    <aside className="community-sidebar">
                        <nav className="category-menu">
                            {CATEGORIES.map(category => (
                                <button
                                    key={category}
                                    className={selectedCategory === category ? 'active' : ''}
                                    onClick={() => setSelectedCategory(category)}
                                >
                                    {category}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    <main className="post-list-area">
                        {isLoading ? <p>게시글을 불러오는 중...</p> : (
                            <>
                                {posts.length === 0 ? (
                                    <p>선택하신 카테고리에 해당하는 게시글이 없습니다.</p>
                                ) : (
                                    <ul className="post-list">
                                        {posts.map(post => (
                                            <li key={post.id} className="post-card">
                                                <Link to={`/community/posts/${post.id}`}>
                                                    {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="post-thumbnail" />}
                                                    <div className="post-card-content">
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
                                                    </div>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </>
                        )}
                    </main>
                </div>

                <Link to="/community/write" className="floating-write-button">
                    <Pencil size={24} />
                    <span>글쓰기</span>
                </Link>
            </div>
        </>
    );
}