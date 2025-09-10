import { useEffect, useRef } from "react";

type KakaoMapProps = {
    onSelect?: (coords: { lat: number; lng: number }) => void;
};

const KakaoMap = ({ onSelect }: KakaoMapProps) => {
    const mapRef = useRef<kakao.maps.Map | null>(null);
    const markerRef = useRef<kakao.maps.Marker | null>(null);

    useEffect(() => {
        const script = document.createElement("script");
        const key = import.meta.env.VITE_KAKAO_REST_KEY;
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;
        script.async = true;
        script.onload = () => {
            window.kakao.maps.load(initMap);
        };
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    const initMap = () => {
        const container = document.getElementById("kakaoMap");
        if (!container) return;

        // 기본 좌표 (서울 시청)
        const defaultLat = 37.5665;
        const defaultLng = 126.9780;

        const map = new window.kakao.maps.Map(container, {
            center: new window.kakao.maps.LatLng(defaultLat, defaultLng),
            level: 3,
        });

        const marker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(defaultLat, defaultLng),
            map,
        });

        mapRef.current = map;
        markerRef.current = marker;

        // 지도 클릭 이벤트
        window.kakao.maps.event.addListener(map, "click", (mouseEvent: kakao.maps.MouseEvent) => {
            const lat = mouseEvent.latLng.getLat();
            const lng = mouseEvent.latLng.getLng();

            marker.setPosition(mouseEvent.latLng);

            if (onSelect) {
                onSelect({ lat, lng });
            }
        });
    };

    return (
        <div
            id="kakaoMap"
            style={{
                width: "100%",
                height: "500px",
                border: "1px solid #ccc",
                borderRadius: "8px",
            }}
        />
    );
};

export default KakaoMap;
