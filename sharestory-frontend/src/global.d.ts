// src/types/global.d.ts
export {};

declare global {
    interface Window {
        kakao: {
            maps: {
                load: (callback: () => void) => void;
                LatLng: new (lat: number, lng: number) => kakao.maps.LatLng;
                Map: new (
                    container: HTMLElement,
                    options: { center: kakao.maps.LatLng; level: number }
                ) => kakao.maps.Map;
                Marker: new (options: { position: kakao.maps.LatLng; map: kakao.maps.Map }) => kakao.maps.Marker;
                event: {
                    addListener: (
                        target: kakao.maps.Map | kakao.maps.Marker,
                        type: string,
                        handler: (event: kakao.maps.MouseEvent) => void
                    ) => void;
                };
            };
        };
    }

    namespace kakao.maps {
        interface LatLng {
            getLat(): number;
            getLng(): number;
        }

        interface Map {
            setCenter(latlng: LatLng): void;
            setLevel(level: number): void;
        }

        interface Marker {
            setPosition(position: LatLng): void;
        }

        interface MouseEvent {
            latLng: LatLng;
        }
    }
}

/* ✅ Swiper CSS 모듈 선언 추가 */
declare module 'swiper/css';
declare module 'swiper/css/navigation';
declare module 'swiper/css/pagination';
