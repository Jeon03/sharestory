import { useEffect, useRef } from "react";

interface Props {
    onClose: () => void;
    onSelect: (lat: number, lon: number, address: string) => void;
}

/* --- ✅ Kakao 지도 SDK용 최소 타입 정의 --- */
interface KakaoLatLng {
    getLat(): number;
    getLng(): number;
}
interface KakaoMouseEvent {
    latLng: KakaoLatLng;
}
interface KakaoAddressResult {
    address: { address_name: string };
}
interface KakaoMap {
    setCenter(latlng: KakaoLatLng): void;
}
interface KakaoServices {
    Status: { OK: string };
    Geocoder: new () => {
        coord2Address(
            lng: number,
            lat: number,
            callback: (result: KakaoAddressResult[], status: string) => void
        ): void;
    };
}
interface KakaoMaps {
    Map: new (
        container: HTMLElement,
        options: { center: KakaoLatLng; level: number }
    ) => KakaoMap;
    LatLng: new (lat: number, lng: number) => KakaoLatLng;
    Marker: new (options: { map: KakaoMap; position: KakaoLatLng }) => KakaoMarker;
    event: {
        addListener(
            target: KakaoMap,
            type: string,
            handler: (event: KakaoMouseEvent) => void
        ): void;
    };
    services: KakaoServices;
}

interface KakaoMarker {
    setMap(map: KakaoMap | null): void;
    setPosition(position: KakaoLatLng): void;
}

export default function LocationPickerModal({ onClose, onSelect }: Props) {
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${
            import.meta.env.VITE_KAKAO_REST_KEY
        }&libraries=services`;
        script.async = true;

        script.onload = () => {
            const kakao = (window as unknown as { kakao: { maps: KakaoMaps } }).kakao;

            // 지도 초기화
            const map = new kakao.maps.Map(mapRef.current as HTMLElement, {
                center: new kakao.maps.LatLng(37.5665, 126.978),
                level: 4,
            });

            const geocoder = new kakao.maps.services.Geocoder();
            let marker: KakaoMarker | null = null;

            // 지도 클릭 이벤트
            kakao.maps.event.addListener(map, "click", (mouseEvent) => {
                const latlng = mouseEvent.latLng;

                // 이전 마커 제거
                if (marker) marker.setMap(null);

                // 새 마커 생성
                marker = new kakao.maps.Marker({
                    map,
                    position: latlng,
                });

                // 좌표 → 주소 변환
                geocoder.coord2Address(
                    latlng.getLng(),
                    latlng.getLat(),
                    (result, status) => {
                        if (status === kakao.maps.services.Status.OK && result[0]) {
                            const address = result[0].address.address_name;
                            onSelect(latlng.getLat(), latlng.getLng(), address);
                        }
                    }
                );
            });
        };

        document.body.appendChild(script);
    }, [onSelect]);

    return (
        <div className="ss-community-modal-overlay">
            <div className="ss-community-modal-content">
                <div ref={mapRef} className="ss-community-map-modal"></div>

                <button onClick={onClose} className="ss-community-map-close-btn">
                    닫기
                </button>
            </div>
        </div>
    );
}
