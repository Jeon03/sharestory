import { useState } from "react";
import CommunityRegionModal from "./CommunityRegionModal";
import "../../css/community.css";

interface RegionButtonProps {
    region: string;
    setRegion: (r: string) => void;
}


export default function RegionButton({ region, setRegion }: RegionButtonProps) {
    const [isModalOpen, setModalOpen] = useState(false);

    const displayRegion = (() => {
        if (region === "전체 지역") return "전체 지역";
        const parts = region.split(" ");
        return parts.slice(0, 2).join(" "); // 시 + 구까지만 표시
    })();

    return (
        <>
            <button
                className="ss-region-button"
                onClick={() => setModalOpen(true)}
            >
                📮 {displayRegion}
            </button>

            {isModalOpen && (
                <CommunityRegionModal
                    onClose={() => setModalOpen(false)}
                    onSelect={(selectedRegion) => {
                        const parts = selectedRegion.split(" ");
                        const shortRegion = parts.slice(0, 2).join(" ");
                        setRegion(shortRegion);
                        setModalOpen(false);
                    }}
                />
            )}
        </>
    );
}
