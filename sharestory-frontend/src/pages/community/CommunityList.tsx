import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import RegionButton from "../../components/community/RegionButton";
import "../../css/community.css";
import type { CommunityPost } from "../../types/community";
import { useAuth } from "../../contexts/useAuth";
import {Eye, Heart, MessageCircle} from "lucide-react";

export default function CommunityList() {
    const [region, setRegion] = useState("전체 지역");
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const { user } = useAuth();

    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const category = query.get("category") || "전체";

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
        if (user?.addressName && region === "전체 지역") {
            const parts = user.addressName.split(" ");
            const shortRegion = parts.slice(0, 2).join(" ");
            setRegion(shortRegion);
        }
    }, [user]);

    /** 📡 지역별 게시글 불러오기 */
    useEffect(() => {
        const query =
            region === "전체 지역" ? "" : `?region=${encodeURIComponent(region)}`;

        fetch(`/api/community/region${query}`)
            .then(async (res) => {
                const text = await res.text();
                try {
                    const data = JSON.parse(text);

                    let posts = [];
                    if (Array.isArray(data)) posts = data;
                    else if (data.posts) posts = data.posts;
                    else posts = [];

                    // ✅ 최신순 정렬
                    posts.sort(
                        (a: CommunityPost, b: CommunityPost) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                    );

                    setPosts(posts);
                } catch (err) {
                    console.error("⚠️ JSON 파싱 오류:", err);
                    setPosts([]);
                }
            })
            .catch((err) => {
                console.error("❌ 커뮤니티 목록 불러오기 실패:", err);
                setPosts([]);
            });
    }, [region, location]); // ✅ location 객체 전체를 넣기!

    /** ✅ 카테고리 필터링 (프론트에서 처리) */
    const filteredPosts = useMemo(() => {
        if (category === "전체") return posts;
        return posts.filter((p) => p.category === category);
    }, [posts, category]);

    return (
        <div className="ss-community-container">
            {/* 🔹 헤더 */}
            <div className="ss-community-header">
                <RegionButton region={region} setRegion={setRegion} />
                <Link to="/community/write" className="ss-community-write-btn">
                    글쓰기 ✏️
                </Link>
            </div>

            {/* 🔹 지역 + 카테고리 제목 */}
            <h2 style={{ marginBottom: "12px" }}>
                {region === "전체 지역"
                    ? category === "전체"
                        ? "전체 게시글"
                        : `${category} 게시글`
                    : `${region}의 ${category === "전체" ? "이야기" : category}`}
            </h2>

            {/* 🔹 게시글 목록 */}
            {filteredPosts.length === 0 ? (
                <p>이 지역에는 아직 게시글이 없습니다.</p>
            ) : (
                filteredPosts.map((p: CommunityPost) => {
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
                            {/* 왼쪽 텍스트 */}
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
                                    <div className="like"><Heart size={16} /> {p.likeCount}</div>
                                    <div className="comment"><MessageCircle size={16} /> {p.commentCount}</div>
                                    <div className="view"><Eye size={16} /> {p.viewCount}</div>
                                </div>
                            </div>

                            {/* 오른쪽 썸네일 */}
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
