import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCommunityPosts } from '../services/communityApi';
import { useAuth } from '../contexts/useAuth'; // 사용자 정보를 가져오기 위해 useAuth 사용
import '../css/CommunityPage.css'; // 간단한 스타일을 위한 CSS 파일 (아래에서 생성)
import { MessageSquare, ThumbsUp, Eye } from 'lucide-react'; // 아이콘

// Post 타입 정의 (API 응답 DTO와 일치)
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

// 시간 포맷팅 함수 (기존 ProductList에서 가져옴)
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
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            if (!user?.myLatitude || !user?.myLongitude) {
                // 사용자 위치 정보가 없으면 로딩 중단
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
    }, [user]);

    if (isLoading) {
        return <div className="community-container">로딩 중...</div>;
    }

    if (!user?.myLatitude || !user?.myLongitude) {
        return (
            <div className="community-container">
                <p>위치 정보가 없습니다. 마이페이지에서 위치를 설정해주세요.</p>
            </div>
        );
    }

    return (
        <div className="community-container">
            <header className="community-header">
                <h1>동네생활</h1>
                <Link to="/community/write" className="write-button">글쓰기</Link>
            </header>
            <main>
                {posts.length === 0 ? (
                    <p>주변에 작성된 게시글이 없습니다.</p>
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
    );
}