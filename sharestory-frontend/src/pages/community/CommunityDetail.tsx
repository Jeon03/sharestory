import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../css/community.css";
import type { CommunityPost } from "../../types/community";
import { useAuth } from "../../contexts/useAuth";

export default function CommunityDetail() {
    const { id } = useParams<{ id: string }>();
    const [post, setPost] = useState<CommunityPost | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const navigate = useNavigate();
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

    // 📡 게시글 데이터 불러오기
    useEffect(() => {
        if (!id) return;
        fetch(`/api/community/${id}`)
            .then((res) => res.json())
            .then((data) => setPost(data))
            .catch((err) => console.error("❌ 커뮤니티 게시글 불러오기 실패:", err));
    }, [id]);


    useEffect(() => {
        if (!post?.latitude || !post?.longitude) return;

        // 이미 스크립트가 로드된 경우
        if (window.kakao && window.kakao.maps) {
            renderMap();
        } else {
            // SDK 스크립트 추가
            const script = document.createElement("script");
            script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${
                import.meta.env.VITE_KAKAO_MAP_API_KEY
            }&autoload=false`; // autoload=false 중요!
            script.async = true;

            script.onload = () => {
                // ✅ Kakao Maps 로드 완료 후 실행
                window.kakao.maps.load(() => {
                    renderMap();
                });
            };

            document.body.appendChild(script);
        }

        // ✅ 지도 렌더링 함수
        function renderMap() {
            if (!window.kakao || !mapRef.current) return;
            const kakao = window.kakao;
            const position = new kakao.maps.LatLng(post!.postLatitude!, post!.postLongitude!);

            const map = new kakao.maps.Map(mapRef.current, {
                center: position,
                level: 4,
            });

            new kakao.maps.Marker({
                map,
                position,
            });
        }
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

        </div>
    );
}
