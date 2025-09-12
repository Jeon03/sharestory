import React, { useEffect, useState } from "react";
import "../css/LocationSelector.css";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

const KAKAO_ADDRESS_KEY = import.meta.env.VITE_KAKAO_ADDRESS_KEY;

interface KakaoAddress {
    address_name: string;
    x: string;
    y: string;
}

interface UserMainResponse {
    id?: number;
    email?: string;
    nickname?: string;
    role?: string;
    myLatitude?: string;
    myLongitude?: string;
    addressName?: string;
    authenticated: boolean;
}

interface ItemSuggestion {
    id: number;
    title: string;
    price: number;
    lat: number;
    lon: number;
    distanceKm?: number;
}
export default function LocationSelector() {
    const [searchResults, setSearchResults] = useState<KakaoAddress[]>([]);
    const [radius, setRadius] = useState(3);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState("동네 설정");
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
        null
    );
    const [coordsReady, setCoordsReady] = useState(false);
    const [searchAddress, setSearchAddress] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [suggestions, setSuggestions] = useState<ItemSuggestion[]>([]);

    const radiusOptions = [1, 3, 5, 10];
    const navigate = useNavigate();

    // ✅ 사용자 위치 불러오기
    useEffect(() => {
        const fetchUserLocation = async () => {
            try {
                const res = await api.get<UserMainResponse>("/main");
                if (res.data.authenticated) {
                    setIsAuthenticated(true);

                    if (res.data.myLatitude && res.data.myLongitude) {
                        setCoords({
                            lat: parseFloat(res.data.myLatitude),
                            lng: parseFloat(res.data.myLongitude),
                        });
                        setSelectedLocation(res.data.addressName || "내 동네");
                    }
                } else {
                    setIsAuthenticated(false);
                    setCoords(null);
                    setSelectedLocation("전체");
                }
            } catch {
                setIsAuthenticated(false);
                setCoords(null);
                setSelectedLocation("전체");
            } finally {
                setCoordsReady(true);
            }
        };

        fetchUserLocation();
    }, []);

    // ✅ 주소 입력
    const handleAddressChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = e.target.value;
        setSearchAddress(value);
        if (!value.trim()) return setSearchResults([]);

        try {
            const res = await fetch(
                `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(
                    value
                )}`,
                { headers: { Authorization: `KakaoAK ${KAKAO_ADDRESS_KEY}` } }
            );
            const data: { documents: KakaoAddress[] } = await res.json();
            setSearchResults(data.documents || []);
        } catch (err) {
            console.error("주소 검색 실패", err);
        }
    };

    // ✅ 주소 선택
    const handleSelectAddress = async (label: string) => {
        setSelectedLocation(label);
        setIsOpen(false);

        try {
            const res = await fetch(
                `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(
                    label
                )}`,
                { headers: { Authorization: `KakaoAK ${KAKAO_ADDRESS_KEY}` } }
            );
            const data: { documents: KakaoAddress[] } = await res.json();
            if (!data.documents?.length)
                return alert("위치 정보를 찾을 수 없습니다.");
            const { y, x } = data.documents[0];
            const lat = parseFloat(y);
            const lng = parseFloat(x);

            setCoords({ lat, lng });

            if (isAuthenticated) {
                await api.put("/users/location", { addressName: label, myLatitude: lat, myLongitude: lng });
                alert(`"${label}"로 동네가 저장되었습니다.`);
            }
        } catch (err) {
            console.error("위치 설정 실패", err);
        }
    };

    // ✅ 상품 자동완성 (키워드 입력 시)
    const handleKeywordChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchKeyword(value);

        if (!value.trim()) {
            setSuggestions([]);
            return;
        }

        try {
            const res = await api.get<ItemSuggestion[]>("/items/autocomplete", {
                params: { keyword: value, lat: coords?.lat ?? 0, lon: coords?.lng ?? 0, distance: `${radius}km` }
            });
            setSuggestions(res.data);
        } catch (err) {
            console.error("자동완성 실패:", err);
        }
    };

    // ✅ 엔터 → 전체 검색 페이지 이동
    const handleSearchSubmit = (e?: React.FormEvent) => {
        if (e?.preventDefault) e.preventDefault();
        if (!coordsReady) {
            alert("위치 정보를 불러오는 중입니다.");
            return;
        }
        if (!searchKeyword.trim()) return;

        const params = new URLSearchParams();
        params.set("keyword", searchKeyword);
        if (coords) {
            params.set("lat", coords.lat.toString());
            params.set("lon", coords.lng.toString());
            params.set("distance", `${radius}km`);
        }
        navigate(`/search?${params.toString()}`);
    };

    return (
        <>
            <button className="select-button" onClick={() => setIsOpen(true)}>
                {selectedLocation}
            </button>

            {isOpen && (
                <>
                    <div className="overlay" onClick={() => setIsOpen(false)} />
                    <div className="modal">
                        <div className="modal-header">
                            <span>지역 변경</span>
                            <button className="close-button" onClick={() => setIsOpen(false)}>
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="search-box">
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="지역이나 동네로 검색"
                                    value={searchAddress}
                                    onChange={handleAddressChange}
                                />
                            </div>

                            {searchResults.length > 0 && (
                                <ul className="autocomplete-suggestions">
                                    {searchResults.map((place, idx) => (
                                        <li
                                            key={idx}
                                            className="autocomplete-item"
                                            onClick={() => handleSelectAddress(place.address_name)}
                                        >
                                            {place.address_name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ✅ 상품 검색창 */}
            <form className="header_search-box" onSubmit={handleSearchSubmit}>
                <input
                    type="text"
                    className="search-input"
                    placeholder="어떤 상품을 찾으시나요?"
                    value={searchKeyword}
                    onChange={handleKeywordChange}
                />

                {/* ✅ 자동완성 리스트 */}
                {suggestions.length > 0 && (
                    <ul className="autocomplete-list">
                        {suggestions.map((item, idx) => (
                            <li
                                key={idx}
                                className="autocomplete-item"
                                onClick={() => navigate(`/items/${item.id}`)} // 상세 페이지 이동
                            >
                                {item.title} - {item.price.toLocaleString()}원
                            </li>
                        ))}
                    </ul>
                )}

                {coords &&
                    selectedLocation !== "전체" &&
                    selectedLocation !== "동네 설정" && (
                        <>
                            <div className="text">검색반경:</div>
                            <select
                                className="radius-select"
                                value={radius}
                                onChange={(e) => setRadius(Number(e.target.value))}
                            >
                                {radiusOptions.map((km) => (
                                    <option key={km} className="kmoption" value={km}>
                                        {km}km
                                    </option>
                                ))}
                            </select>
                        </>
                    )}

                <button type="submit">검색</button>
            </form>
        </>
    );
}
