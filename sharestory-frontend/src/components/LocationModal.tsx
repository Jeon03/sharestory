import { useEffect, useState, useRef } from 'react';
import { updateUserLocation, getAddressFromCoords } from '../services/userApi';
import '../css/LocationModal.css';

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
}

export default function LocationModal({ isOpen, onClose, onSaveSuccess }: LocationModalProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    // ✅ 수정: any 타입을 구체적인 카카오맵 타입으로 변경
    const [map, setMap] = useState<kakao.maps.Map | null>(null);
    const [marker, setMarker] = useState<kakao.maps.Marker | null>(null);

    const [selectedLat, setSelectedLat] = useState<number | null>(null);
    const [selectedLng, setSelectedLng] = useState<number | null>(null);
    const [addressName, setAddressName] = useState('지도를 움직여 위치를 설정하세요.');

    useEffect(() => {
        if (isOpen && mapContainerRef.current && !map) {
            window.kakao.maps.load(() => {
                const mapOption = {
                    center: new window.kakao.maps.LatLng(37.5170, 126.8665),
                    level: 5,
                };
                const newMap = new window.kakao.maps.Map(mapContainerRef.current!, mapOption);
                const newMarker = new window.kakao.maps.Marker({
                    position: newMap.getCenter(),
                    map: newMap,
                });
                setMap(newMap);
                setMarker(newMarker);
                updateLocationInfo(newMap.getCenter());

                window.kakao.maps.event.addListener(newMap, 'dragend', () => {
                    updateLocationInfo(newMap.getCenter());
                });
            });
        }
    }, [isOpen, map]);

    // ✅ 수정: latLng 파라미터의 타입을 any에서 구체적인 타입으로 변경
    const updateLocationInfo = async (latLng: kakao.maps.LatLng) => {
        const lat = latLng.getLat();
        const lng = latLng.getLng();
        setSelectedLat(lat);
        setSelectedLng(lng);
        marker?.setPosition(latLng);

        setAddressName('주소 찾는 중...');
        const address = await getAddressFromCoords(lat, lng);
        setAddressName(address);
    };

    const handleSetCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newLatLng = new window.kakao.maps.LatLng(
                        position.coords.latitude,
                        position.coords.longitude
                    );
                    map?.setCenter(newLatLng);
                    updateLocationInfo(newLatLng);
                },
                () => alert('위치 정보를 가져올 수 없습니다.')
            );
        } else {
            alert('이 브라우저에서는 위치 기능을 지원하지 않습니다.');
        }
    };

    const handleSaveLocation = async () => {
        if (!selectedLat || !selectedLng || !addressName.includes(' ')) {
            alert('유효한 위치를 선택해주세요.');
            return;
        }
        try {
            await updateUserLocation({
                latitude: selectedLat,
                longitude: selectedLng,
                addressName: addressName,
            });
            alert('동네 설정이 완료되었습니다.');
            onSaveSuccess();
        } catch (error) {
            console.error(error);
            alert('위치 정보 저장 중 오류가 발생했습니다.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="location-modal-overlay" onClick={onClose}>
            <div className="location-modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>내 동네 설정하기</h3>
                <div ref={mapContainerRef} style={{ width: '100%', height: '300px', marginBottom: '10px' }}></div>
                <div className="location-info">📍 {addressName}</div>
                <div className="modal-buttons">
                    <button onClick={handleSetCurrentLocation}>현재 위치로 설정</button>
                    <button onClick={handleSaveLocation} className="save-button">이 위치로 동네 설정</button>
                </div>
            </div>
        </div>
    );
}