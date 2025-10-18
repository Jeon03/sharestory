import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../css/community.css";
import type { CommunityPost } from "../../types/community";
import { useAuth } from "../../contexts/useAuth";
import CommentSection from "../../components/community/CommentSection";
import "../../css/CommentSection.css";
import { Heart, Eye } from "lucide-react";

export default function CommunityDetail() {
    const { id } = useParams<{ id: string }>();
    const [post, setPost] = useState<CommunityPost | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const [liked, setLiked] = useState(false);
    const { user, openLogin } = useAuth();

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

    useEffect(() => {
        if (!id) return;
        fetch(`/api/community/${id}?userId=${user?.id || ""}`)
            .then((res) => res.json())
            .then((data) => {
                setPost(data);
                setLiked(data.liked);
            })
            .catch((err) => console.error("❌ 커뮤니티 게시글 불러오기 실패:", err));
    }, [id, user]);

// ❤️ 좋아요 토글
    const handleLike = async () => {
        // 🚫 1. 로그인 안된 경우
        if (!user || !user.id) {
            openLogin();
            return;
        }

        try {
            const res = await fetch(`/api/community/likes/${id}?userId=${user.id}`, {
                method: "POST",
            });

            // 🚨 2. 401, 403, 400 등 비정상 응답일 경우 → 로그인 유도
            if (!res.ok) {
                console.warn("❌ 좋아요 요청 실패:", res.status);
                if (res.status === 401 || res.status === 403 || res.status === 400) {
                    openLogin();
                }
                return;
            }

            // ✅ 3. 성공 시 like 상태 업데이트
            const newLiked = await res.json();
            setLiked(newLiked);
            setPost((prev) =>
                prev ? { ...prev, likeCount: prev.likeCount + (newLiked ? 1 : -1) } : prev
            );
        } catch (err) {
            console.error("❌ 좋아요 요청 중 예외:", err);
            openLogin(); // ✅ 네트워크 실패 시에도 로그인 모달 열기
        }
    };


    // 🗺️ 카카오 지도 로드
    useEffect(() => {
        if (!post?.postLatitude || !post?.postLongitude) return;

        const loadKakaoMap = () => {
            if (!window.kakao || !window.kakao.maps) return;
            const container = mapRef.current;
            if (!container) return;

            const kakao = window.kakao;
            const position = new kakao.maps.LatLng(post!.postLatitude!, post!.postLongitude!);

            const map = new kakao.maps.Map(container, {
                center: position,
                level: 4,
            });

            new kakao.maps.Marker({ map, position });
        };

        // ✅ 이미 SDK가 로드된 경우
        if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(loadKakaoMap);
            return;
        }

        // ✅ 중복 로드 방지
        const existingScript = document.querySelector(
            'script[src*="dapi.kakao.com/v2/maps/sdk.js"]'
        );
        if (existingScript) {
            existingScript.addEventListener("load", () => {
                window.kakao.maps.load(loadKakaoMap);
            });
            return;
        }

        // ✅ 새로 스크립트 로드
        const script = document.createElement("script");
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${
            import.meta.env.VITE_KAKAO_MAP_API_KEY
        }&autoload=false`;
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
            window.kakao.maps.load(loadKakaoMap);
        };
    }, [post]);

    // 🗑️ 게시글 삭제 기능
    const handleDelete = async () => {
        if (!window.confirm("정말 이 게시글을 삭제하시겠습니까?")) return;
        try {
            const res = await fetch(`/api/community/${id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (res.ok) {
                alert("게시글이 삭제되었습니다.");
                navigate("/community");
            } else {
                const msg = await res.text();
                alert("삭제 실패: " + msg);
            }
        } catch (err) {
            console.error("❌ 게시글 삭제 실패:", err);
            alert("서버 오류가 발생했습니다.");
        }
    };

    if (!post) return <div className="ss-community-detail">게시글을 불러오는 중...</div>;

    return (
        <div className="ss-community-detail">

            <div className="ss-community-detail-author">
                <p className="ss-author-name">{post.authorName}</p>
                <p className="ss-author-meta">
                    {post.locationName} · {formatTimeAgo(post.createdAt)}
                </p>
            </div>


            <h2 className="ss-community-detail-title">{post.title}</h2>
            <div className="ss-community-detail-content">{post.content}</div>
            {(post?.imageUrls?.length ?? 0) > 0 && (
                <div className="ss-community-detail-images">
                    {post.imageUrls!.map(
                        (url, i) => url && <img key={i} src={url} alt={`img-${i}`} />
                    )}
                </div>
            )}
            {post.postLatitude && post.postLongitude && (
                <div className="ss-community-map-preview">
                    <div className="ss-community-map-container" ref={mapRef}></div>
                </div>
            )}

            {user?.email === post.authorEmail && (
                <button className="ss-community-delete-btn" onClick={handleDelete}>
                    🗑️ 삭제하기
                </button>
            )}

            {/* ❤️ 좋아요 + 👁 조회수 표시 */}
            <div className="ss-community-detail-footer">
                <button
                    className={`like-btn ${liked ? "liked" : ""}`}
                    onClick={handleLike}
                >
                    <Heart size={18} fill={liked ? "red" : "none"} color={liked ? "red" : "#555"} />
                    <span>{post.likeCount}</span>
                </button>

                <div className="view-count">
                    <Eye size={18} />
                    <span>{post.viewCount}</span>
                </div>
            </div>

            <CommentSection postId={post.id} userId={user?.id ?? 0} />

        </div>
    );
}
