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
                Marker: new (options: {
                    position?: kakao.maps.LatLng;
                    map: kakao.maps.Map;
                    draggable?: boolean;
                }) => kakao.maps.Marker;
                Circle: new (options: kakao.maps.CircleOptions) => kakao.maps.Circle;
                event: {
                    addListener: (
                        target: kakao.maps.Map | kakao.maps.Marker,
                        type: string,
                        handler: (event: kakao.maps.event.MouseEvent) => void
                    ) => void;
                };
                services: {
                    Geocoder: new () => kakao.maps.services.Geocoder;
                    Status: { OK: string };
                };
            };
        };

        daum: {
            Postcode: new (options: {
                oncomplete: (data: DaumPostcodeData) => void;
            }) => {
                open: () => void;
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
            relayout(): void;
            getCenter(): LatLng; // ✅ 이 줄을 추가해주세요.

        }

        interface Marker {
            setPosition(position: LatLng): void;
            getPosition(): LatLng;
            setMap(map: Map | null): void;
        }

        interface Circle {
            setMap(map: Map | null): void;
            setOptions(options: { center?: LatLng; radius?: number }): void;
        }

        interface CircleOptions {
            map: Map;
            center: LatLng;
            radius: number;
            strokeWeight?: number;
            strokeColor?: string;
            strokeOpacity?: number;
            strokeStyle?: string;
            fillColor?: string;
            fillOpacity?: number;
        }

        namespace event {
            interface MouseEvent {
                latLng: LatLng;
            }
        }

        namespace services {
            interface Geocoder {
                coord2Address(
                    lng: number,
                    lat: number,
                    callback: (
                        result: { address: { address_name: string } }[],
                        status: string
                    ) => void
                ): void;
            }
        }
    }

    interface DaumPostcodeData {
        address: string;
        zonecode: string;
        roadAddress: string;
        jibunAddress: string;
        buildingName?: string;
        bname?: string;
        sido?: string;
        sigungu?: string;
    }
}

/* ✅ Swiper CSS 모듈 선언 추가 */
declare module "swiper/css";
declare module "swiper/css/navigation";
declare module "swiper/css/pagination";
