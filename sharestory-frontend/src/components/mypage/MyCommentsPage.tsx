import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import type { CommunityPost } from "../../types/community";
import "../../css/community.css";
import { Eye, Heart, MessageCircle } from "lucide-react";
import { useAuth } from "../../contexts/useAuth";

export default function MyCommentsPage() {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const { user, openLogin } = useAuth();

    useEffect(() => {
        if (!user) {
            openLogin();
            return;
        }
        api.get<CommunityPost[]>("/community/mycomments", { withCredentials: true })
            .then((res) => setPosts(res.data))
            .catch((err) => {
                console.error("❌ 내가 댓글 단 글 조회 실패:", err);
                if (err.response?.status === 401) openLogin(); // 세션 만료 시 재로그인 유도
            });
    }, [user]);

    const formatTimeAgo = (dateStr: string | null | undefined): string => {
        if (!dateStr) return "";
        const created = new Date(dateStr).getTime();
        if (Number.isNaN(created)) return "";
        const now = Date.now();
        const diffMs = Math.max(0, now - created);
        const sec = Math.floor(diffMs / 1000);
        const min = Math.floor(sec / 60);
        const hr = Math.floor(min / 60);
        const day = Math.floor(hr / 24);

        if (day > 0) return `${day}일 전`;
        if (hr > 0) return `${hr}시간 전`;
        if (min > 0) return `${min}분 전`;
        return "방금 전";
    };

    return (
        <div className="ss-community-container">
            <h2>💬 내가 댓글 단 글</h2>

            {posts.length === 0 ? (
                <p>댓글을 단 게시글이 없습니다.</p>
            ) : (
                posts.map((p) => {
                    const shortLocation = p.locationName
                        ? p.locationName.split(" ").slice(0, 2).join(" ")
                        : "";
                    const timeAgo = formatTimeAgo(p.createdAt);

                    return (
                        <Link
                            to={`/community/${p.id}`}
                            key={p.id}
                            className="ss-community-post-card"
                        >
                            <div className="ss-community-post-info">
                                <h4>{p.title}</h4>
                                <p className="ss-community-content-preview">
                                    {p.content?.length > 60
                                        ? `${p.content.slice(0, 60)}...`
                                        : p.content}
                                </p>
                                <p className="ss-community-meta">
                                    {shortLocation} · {p.category} · {timeAgo}
                                </p>
                                <div className="community-stats">
                                    <div><Heart size={16}/> {p.likeCount}</div>
                                    <div><MessageCircle size={16}/> {p.commentCount}</div>
                                    <div><Eye size={16}/> {p.viewCount}</div>
                                </div>
                            </div>

                            {p.imageUrls?.length > 0 && (
                                <img
                                    src={p.imageUrls[0]}
                                    alt="thumbnail"
                                    className="ss-community-thumbnail"
                                />
                            )}
                        </Link>
                    );
                })
            )}
        </div>
    );
}
