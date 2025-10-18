import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import api from "../../api/axios.ts";
import "../../css/CommentSection.css";
import { useAuth } from "../../contexts/useAuth";

interface Comment {
    id: number;
    userId: number;
    authorName: string;
    content: string;
    createdAt: string;
    replies?: Comment[];
}

interface Props {
    postId: number;
    userId: number;
}

export default function CommentSection({ postId, userId }: Props) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [content, setContent] = useState("");
    const { user, openLogin } = useAuth();

    // ✅ 댓글 불러오기
    const fetchComments = async () => {
        try {
            const res = await api.get<Comment[]>(`/comments/${postId}`);
            setComments(res.data);
        } catch (err) {
            console.error("❌ 댓글 불러오기 실패:", err);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [postId]);

    // ✅ 댓글 등록
    const handleSubmit = async (parentId: number | null, text: string) => {
        if (!user) {
            openLogin(); // 🚀 비로그인 → 로그인 모달 열기
            return;
        }

        if (!text.trim()) return;

        try {
            await api.post("/comments", {
                postId,
                userId,
                content: text,
                parentId,
            });
            setContent("");
            await fetchComments();
        } catch (err) {
            console.error("❌ 댓글 등록 실패:", err);
            openLogin();
        }
    };

    // ✅ 댓글 삭제
    const handleDelete = async (commentId: number) => {
        if (!window.confirm("정말 이 댓글을 삭제하시겠습니까?")) return;
        try {
            const res = await api.delete(`/comments/${commentId}`, {
                params: { userId },
            });

            if (res.status === 200) {
                // 성공 시 해당 댓글 제거
                setComments((prev) => removeCommentRecursively(prev, commentId));
            } else {
                alert("삭제 권한이 없습니다.");
            }
        } catch (err) {
            console.error("❌ 댓글 삭제 실패:", err);
        }
    };

    // ✅ 재귀적으로 삭제 (대댓글 구조에서도 작동)
    const removeCommentRecursively = (list: Comment[], targetId: number): Comment[] => {
        return list
            .filter((c) => c.id !== targetId)
            .map((c) => ({
                ...c,
                replies: c.replies ? removeCommentRecursively(c.replies, targetId) : [],
            }));
    };

    return (
        <div className="ss-comment-section">
            <h3 className="ss-comment-title">댓글</h3>

            {/* 입력창 */}
            <div className="ss-comment-input">
                <input
                    type="text"
                    placeholder="댓글을 입력하세요"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <button
                    onClick={() => {
                        handleSubmit(null, content);
                        setContent("");
                    }}
                >
                    등록
                </button>
            </div>

            {/* 댓글 목록 */}
            <div className="ss-comment-list">
                {comments.map((comment) => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        onReply={handleSubmit}
                        onDelete={handleDelete}
                        currentUserId={userId}
                    />
                ))}
            </div>
        </div>
    );
}

/* ✅ 개별 댓글 + 대댓글 렌더링 */
function CommentItem({
                         comment,
                         onReply,
                         onDelete,
                         currentUserId,
                     }: {
    comment: Comment;
    onReply: (id: number | null, text: string) => void;
    onDelete: (commentId: number) => void;
    currentUserId: number;
}) {
    const [replyText, setReplyText] = useState("");
    const [showReplyBox, setShowReplyBox] = useState(false);

    return (
        <div className="ss-comment-item">
            <div className="ss-comment-content">
                <div className="ss-comment-header">
                    <p className="ss-comment-author">
                        <b>{comment.authorName}</b>
                    </p>
                </div>

                <p className="ss-comment-text">{comment.content}</p>

                <div className="ss-comment-meta">
                    <span>
                        {new Date(comment.createdAt).toLocaleString("ko-KR")}
                    </span>
                {/* 🗑️ 본인 댓글만 삭제 가능 */}
                {currentUserId === comment.userId && (
                    <button
                        className="ss-comment-delete-btn"
                        onClick={() => onDelete(comment.id)}
                    >
                        <Trash2 size={15} />
                    </button>
                )}
                <button
                    className="ss-comment-reply-btn"
                    onClick={() => setShowReplyBox(!showReplyBox)}
                >
                    답글
                </button>
            </div>
            </div>

            {showReplyBox && (
                <div className="ss-reply-input">
                    <input
                        type="text"
                        placeholder="답글을 입력하세요"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                    />
                    <button
                        onClick={() => {
                            onReply(comment.id, replyText);
                            setReplyText("");
                            setShowReplyBox(false);
                        }}
                    >
                        등록
                    </button>
                </div>
            )}

            {/* ✅ 대댓글 리스트 */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="ss-reply-list">
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            onReply={onReply}
                            onDelete={onDelete}
                            currentUserId={currentUserId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
