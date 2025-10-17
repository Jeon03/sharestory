import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LocationPickerModal from "../../components/community/LocationPickerModal";
import "../../css/community.css";
import { useAuth } from "../../contexts/useAuth";

export default function CommunityWrite() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [sharedLocation, setSharedLocation] = useState<{ lat: number; lon: number; address: string } | null>(null);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const navigate = useNavigate();
    const [category, setCategory] = useState("일반");
    const { user } = useAuth();

    /** 📷 이미지 미리보기 핸들러 */
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setImages(Array.from(e.target.files));
    };

    const categories = [
        "맛집", "동네행사", "반려동물", "운동", "생활/편의",
        "분실/실종", "병원/약국", "고민/사연", "동네친구", "이사/시공",
        "주거/부동산", "교육", "취미", "동네사건사고", "동네풍경",
        "미용", "임신/육아", "일반"
    ];

    /** 📝 글 등록 */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.myLatitude || !user?.myLongitude) {
            alert("먼저 내 동네를 설정해주세요.");
            return;
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("content", content);
        formData.append("category", category);
        // ✅ 1️⃣ 사용자 기본 위치 (검색용)
        formData.append("latitude", String(user.myLatitude));
        formData.append("longitude", String(user.myLongitude));

        // ✅ 2️⃣ locationName — 지도 선택 시 덮어쓰기
        if (sharedLocation) {
            formData.append("postLatitude", String(sharedLocation.lat));
            formData.append("postLongitude", String(sharedLocation.lon));
            formData.append("locationName", sharedLocation.address);
        } else {
            formData.append("locationName", user.addressName || "");
        }

        // ✅ 3️⃣ 이미지 추가
        images.forEach((img) => formData.append("images", img));

        try {
            const res = await fetch("/api/community/write", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                alert("게시글이 등록되었습니다!");
                navigate("/community");
            } else {
                const msg = await res.text();
                alert("등록 실패: " + msg);
            }
        } catch (err) {
            console.error("❌ 등록 실패:", err);
            alert("서버 오류가 발생했습니다.");
        }
    };


    return (
        <div className="ss-community-write-container">
            <h2>새 글쓰기</h2>

            <form onSubmit={handleSubmit}>
                <div className="ss-community-category">
                    <label>카테고리 선택</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                        {categories.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>
                <input
                    type="text"
                    placeholder="제목을 입력하세요"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />

                <textarea
                    placeholder="내용을 입력하세요"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                />

                {/* 이미지 업로드 */}
                <label className="ss-community-upload-label">
                    📷 사진 첨부
                    <input type="file" multiple accept="image/*" onChange={handleImageChange} hidden />
                </label>

                {images.length > 0 && (
                    <div className="ss-community-image-preview">
                        {images.map((file, i) => (
                            <img key={i} src={URL.createObjectURL(file)} alt={`preview-${i}`} />
                        ))}
                    </div>
                )}

                {/* 위치 선택 (선택 사항) */}
                <div style={{ margin: "14px 0" }}>
                    <button
                        type="button"
                        onClick={() => setIsMapOpen(true)}
                        className="ss-community-location-btn"
                    >
                        위치 공유하기
                    </button>

                    {sharedLocation && (
                        <p style={{ marginTop: "8px", color: "#666", fontSize: "14px" }}>
                            선택한 위치: {sharedLocation.address}
                        </p>
                    )}
                </div>

                {/* 등록 버튼 */}
                <button type="submit" className="ss-community-submit-btn">
                    등록하기
                </button>
            </form>

            {/* 지도 모달 */}
            {isMapOpen && (
                <LocationPickerModal
                    onClose={() => setIsMapOpen(false)}
                    onSelect={(lat, lon, address) => {
                        setSharedLocation({ lat, lon, address });
                        setIsMapOpen(false);
                    }}
                />
            )}
        </div>
    );
}
