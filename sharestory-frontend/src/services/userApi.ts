import { fetchWithAuth } from "../utils/fetchWithAuth";

const API_BASE = import.meta.env.VITE_API_BASE || '';

interface LocationData {
    latitude: number;
    longitude: number;
    addressName: string;
}

// ✅ [수정] 백엔드 UserController에 맞게 API 호출 코드를 변경합니다.
export const updateUserLocation = async (locationData: LocationData) => {
    const response = await fetchWithAuth(`${API_BASE}/users/location`, { // URL 변경
        method: 'PUT', // 메소드 변경
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            // DTO 필드명에 맞게 데이터 전송
            myLatitude: locationData.latitude,
            myLongitude: locationData.longitude,
            addressName: locationData.addressName,
        }),
    });

    if (!response.ok) {
        throw new Error('위치 정보 업데이트에 실패했습니다.');
    }

    // UserController가 Map을 반환하므로 .json()으로 파싱합니다.
    return await response.json();
};

export const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    const response = await fetch(`${API_BASE}/map/region?lat=${lat}&lng=${lng}`);
    if (!response.ok) return "알 수 없음";
    const data = await response.json();
    return data.documents?.[0]?.address_name || "주소를 찾을 수 없음";
};