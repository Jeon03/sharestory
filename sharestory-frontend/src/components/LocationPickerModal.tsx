import { useEffect, useRef, useState } from "react";

interface LocationPickerModalProps {
    onConfirm: (lat: number, lng: number, address: string) => void;
    onCancel: () => void;
}

export default function LocationPickerModal({ onConfirm, onCancel }: LocationPickerModalProps) {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const markerRef = useRef<kakao.maps.Marker | null>(null);

    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [address, setAddress] = useState<string>("");

    useEffect(() => {
        if (!mapRef.current) return;
        if (!window.kakao || !window.kakao.maps) {
            console.error("❌ Kakao Maps SDK가 아직 로드되지 않았습니다.");
            return;
        }

        window.kakao.maps.load(() => {
            const map = new window.kakao.maps.Map(mapRef.current!, {
                center: new window.kakao.maps.LatLng(37.5665, 126.978),
                level: 3,
            });

            // 지도 클릭 시 이벤트
            window.kakao.maps.event.addListener(
                map,
                "click",
                (mouseEvent: kakao.maps.event.MouseEvent) => {
                    const latlng = mouseEvent.latLng;

                    // 기존 마커 제거
                    if (markerRef.current) {
                        markerRef.current.setMap(null);
                    }

                    // 새 마커 표시
                    const newMarker = new window.kakao.maps.Marker({
                        position: latlng,
                        map,
                    });
                    markerRef.current = newMarker;

                    const lat = latlng.getLat();
                    const lng = latlng.getLng();
                    setCoords({ lat, lng });

                    // 주소 변환
                    const geocoder = new window.kakao.maps.services.Geocoder();
                    geocoder.coord2Address(lng, lat, (result, status) => {
                        if (status === window.kakao.maps.services.Status.OK) {
                            const addr = result[0].address.address_name;
                            setAddress(addr);
                        }
                    });
                }
            );
        });
    }, []);

    return (
        <div className="location-modal-overlay">
            <div className="location-modal">
                <h3>📍 위치 선택</h3>
                <div ref={mapRef} style={{ width: "100%", height: "300px" }} />

                {coords && (
                    <p className="location-info">
                        선택한 위치: {address || `${coords.lat}, ${coords.lng}`}
                    </p>
                )}

                <div className="location-modal-actions">
                    <button onClick={onCancel}>취소</button>
                    <button
                        disabled={!coords}
                        onClick={() => {
                            if (coords) {
                                onConfirm(coords.lat, coords.lng, address || "");
                            }
                        }}
                    >
                        공유하기
                    </button>
                </div>
            </div>
        </div>
    );
}
