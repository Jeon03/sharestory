import { useEffect, useState } from "react";
import "../../css/community.css";

interface Props {
    onClose: () => void;
    onSelect: (region: string) => void;
}


interface KakaoAddressDocument {
    address_name: string;
    address_type?: string;
    x?: string;
    y?: string;
}


interface RegionItem {
    address_name: string;
}


export default function CommunityRegionModal({ onClose, onSelect }: Props) {
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<RegionItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!search.trim()) {
            setResults([]);
            return;
        }

        const fetchRegions = async () => {
            try {
                setLoading(true);

                const res = await fetch(
                    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(search)}`,
                    {
                        headers: {
                            Authorization: `KakaoAK ${import.meta.env.VITE_KAKAO_ADDRESS_KEY}`,
                        },
                    }
                );

                // ✅ 명확한 타입 지정으로 any 제거
                const data: { documents: KakaoAddressDocument[] } = await res.json();

                if (Array.isArray(data.documents)) {
                    setResults(
                        data.documents.map((doc) => ({
                            address_name: doc.address_name,
                        }))
                    );
                } else {
                    setResults([]);
                }
            } catch (err) {
                console.error("주소 검색 실패:", err);
            } finally {
                setLoading(false);
            }
        };

        const delay = setTimeout(fetchRegions, 400);
        return () => clearTimeout(delay);
    }, [search]);

    const handleSelectAll = () => {
        onSelect("전체 지역"); // ✅ region state에 "전체 지역" 설정
        onClose(); // ✅ 모달 닫기
    };

    return (
        <div className="ss-region-modal-overlay">
            <div className="ss-region-modal">
                {/* 헤더 */}
                <div className="ss-region-modal-header">
                    <h3>지역 변경</h3>
                    <button onClick={onClose}>✖</button>
                </div>

                {/* 검색 입력창 */}
                <div className="ss-region-search-box">
                    <input
                        type="text"
                        placeholder="지역이나 동네로 검색하기"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="ss-region-search"
                    />
                    {search && (
                        <button
                            className="ss-region-clear"
                            onClick={() => setSearch("")}
                            aria-label="검색어 지우기"
                        >
                            ×
                        </button>
                    )}
                </div>

                {/* ✅ 전체 지역 보기 버튼 */}
                <button
                    className="ss-region-locate-btn"
                    onClick={handleSelectAll}
                >
                    🌏 전체 지역
                </button>

                {/* 검색 결과 */}
                <div className="ss-region-list">
                    {loading && <p className="ss-region-loading">검색 중...</p>}
                    {!loading && results.length === 0 && search && (
                        <p className="ss-region-empty">검색 결과가 없습니다.</p>
                    )}
                    {results.map((r, idx) => (
                        <div
                            key={idx}
                            className="ss-region-item"
                            onClick={() => onSelect(r.address_name)}
                        >
                            {r.address_name}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
