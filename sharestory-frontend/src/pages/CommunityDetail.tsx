import { useEffect, useState } from 'react';
// ✅ 수정: useNavigate 추가
import { Link, useParams, useNavigate } from 'react-router-dom';
// ✅ 수정: togglePostLike, deletePost API 함수 import 추가
import { getCommunityPostDetail, getComments, createComment, togglePostLike, deletePost } from '../services/communityApi';
import { useAuth } from '../contexts/useAuth';
import '../css/CommunityDetail.css';
import { MessageSquare, ThumbsUp, Eye } from 'lucide-react';

// ✅ 수정: Post 타입에 authorId와 isLiked 추가
interface Post {
    id: number;
    authorId: number;
    authorNickname: string;
    category: string;
    title: string;
    content: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    isLiked: boolean;
    createdAt: string;
}
interface Comment {
    id: number;
    authorNickname: string;
    content: string;
    createdAt: string;
}

const formatTime = (dateStr: string) => new Date(dateStr).toLocaleString();

export default function CommunityDetail() {
    const { id } = useParams<{ id: string }>();
    const { user, openLogin } = useAuth();
    const navigate = useNavigate(); // ✅ 추가: 페이지 이동을 위한 useNavigate
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    const fetchPostAndComments = async () => {
        if (!id) return;
        try {
            setIsLoading(true);
            const postData = await getCommunityPostDetail(id);
            const commentsData = await getComments(id);
            setPost(postData);
            setIsLiked(postData.isLiked);
            setLikeCount(postData.likeCount);
            setComments(commentsData);
        } catch (error) {
            console.error(error);
            alert("데이터를 불러오는 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPostAndComments();
    }, [id]);

    const handleLikeClick = async () => {
        if (!user) {
            alert('로그인이 필요합니다.');
            openLogin();
            return;
        }
        if (!id) return;

        try {
            const result = await togglePostLike(id);
            setIsLiked(result.isLiked);
            setLikeCount(result.likeCount);
        } catch (error) {
            console.error(error); // ✅ 추가
            alert('좋아요 처리 중 오류가 발생했습니다.');
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            alert('로그인이 필요합니다.');
            openLogin();
            return;
        }
        if (!id || !newComment.trim()) return;

        try {
            await createComment(id, newComment);
            setNewComment('');
            fetchPostAndComments();
        } catch (error) {
            console.error(error); // ✅ 추가
            alert('좋아요 처리 중 오류가 발생했습니다.');
        }
    };

    // ✅ 추가: 게시글 삭제 핸들러
    const handleDelete = async () => {
        if (!id) return;
        if (window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
            try {
                await deletePost(id);
                alert("게시글이 삭제되었습니다.");
                navigate('/community');
            } catch (error) {
                console.error(error); // ✅ 추가
                alert('좋아요 처리 중 오류가 발생했습니다.');
            }
        }
    };

    if (isLoading) return <div className="detail-container">로딩 중...</div>;
    if (!post) return <div className="detail-container">게시글을 찾을 수 없습니다.</div>;

    return (
        <div className="detail-container">
            <article className="post-article">
                <header className="post-header">
                    <span className="post-category">{post.category}</span>
                    <h1 className="post-title">{post.title}</h1>
                    <div className="post-meta">
                        <span>{post.authorNickname}</span>
                        <span>{formatTime(post.createdAt)}</span>
                        {/* ✅ 추가: 작성자 본인일 때만 수정/삭제 버튼 표시 */}
                        {user && user.id === post.authorId && (
                            <div className="post-actions">
                                <Link to={`/community/posts/${post.id}/edit`} className="action-button">수정</Link>
                                <button onClick={handleDelete} className="action-button delete">삭제</button>
                            </div>
                        )}
                    </div>
                    <div className="post-stats">
                        <span><Eye size={14} /> {post.viewCount}</span>
                        {/* ✅ 수정: 좋아요 버튼 기능 연결 */}
                        <button onClick={handleLikeClick} className="like-button">
                            <ThumbsUp size={14} fill={isLiked ? '#535bf2' : 'none'} /> {likeCount}
                        </button>
                        <span><MessageSquare size={14} /> {post.commentCount}</span>
                    </div>
                </header>
                <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }} />
            </article>

            <section className="comment-section">
                {/* ... 댓글 관련 JSX (수정 없음) ... */}
                <h3>댓글 {comments.length}</h3>
                <ul className="comment-list">
                    {comments.map(comment => (
                        <li key={comment.id} className="comment-item">
                            <div className="comment-author">{comment.authorNickname}</div>
                            <p className="comment-content">{comment.content}</p>
                            <div className="comment-date">{formatTime(comment.createdAt)}</div>
                        </li>
                    ))}
                </ul>
                <form className="comment-form" onSubmit={handleCommentSubmit}>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={user ? "댓글을 입력하세요" : "로그인 후 댓글을 작성할 수 있습니다."}
                        rows={3}
                        disabled={!user}
                    />
                    <button type="submit" disabled={!user}>등록</button>
                </form>
            </section>
        </div>
    );
}