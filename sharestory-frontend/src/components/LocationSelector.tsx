import React, { useEffect, useState } from "react";
import "../css/LocationSelector.css";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import searchIcon from "../images/search.svg";
import type { ItemSummary } from "../types/item";

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
    const [suggestions, setSuggestions] = useState<ItemSummary[]>([]);

    const radiusOptions = [1, 3, 5, 10];
    const navigate = useNavigate();

    // ✅ 유저 위치 불러오기
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
                    setSelectedLocation("지역선택");
                }
            } catch {
                setIsAuthenticated(false);
                setCoords(null);
                setSelectedLocation("지역선택");
            } finally {
                setCoordsReady(true);
            }
        };

        fetchUserLocation();
    }, []);

    // ✅ 자동완성 리스트 5초 뒤 닫기
    useEffect(() => {
        if (suggestions.length > 0) {
            const timer = setTimeout(() => setSuggestions([]), 5000);
            return () => clearTimeout(timer);
        }
    }, [suggestions]);

    // ✅ 주소 입력
    const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
            if (!data.documents?.length) return alert("위치 정보를 찾을 수 없습니다.");

            const { y, x } = data.documents[0];
            const lat = parseFloat(y);
            const lng = parseFloat(x);
            setCoords({ lat, lng });

            if (isAuthenticated) {
                await api.put("/users/location", {
                    addressName: label,
                    myLatitude: lat,
                    myLongitude: lng,
                });
                alert(`"${label}"로 동네가 저장되었습니다.`);
            }
        } catch (err) {
            console.error("위치 설정 실패", err);
        }
    };

    // ✅ 키워드 변경 → 자동완성 요청
    const handleKeywordChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchKeyword(value);

        if (!value.trim()) {
            setSuggestions([]);
            return;
        }

        try {
            const res = await api.get<ItemSummary[]>("/items/autocomplete", {
                params: {
                    keyword: value,
                    lat: coords?.lat ?? 0,
                    lon: coords?.lng ?? 0,
                    distance: `${radius}km`,
                },
            });
            setSuggestions(res.data);
        } catch (err) {
            console.error("자동완성 실패:", err);
        }
    };

    // ✅ 엔터 → 검색 페이지 이동
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

            {/* 지역 모달 */}
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

            {/* 상품 검색창 */}
            <form className="header_search-box" onSubmit={handleSearchSubmit}>
                <input
                    type="text"
                    className="search-input"
                    placeholder="어떤 상품을 찾으시나요?"
                    value={searchKeyword}
                    onChange={handleKeywordChange}
                />

                {/* 자동완성 리스트 */}
                {suggestions.length > 0 && (
                    <ul className="autocomplete-list">
                        {suggestions.map((item) => (
                            <li
                                key={item.id}
                                className="autocomplete-item"
                                onClick={() => navigate(`/items/${item.id}`)}
                            >
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <img
                                        src={item.imageUrl || "/placeholder.png"}
                                        alt={item.title}
                                        style={{
                                            width: 40,
                                            height: 40,
                                            objectFit: "cover",
                                            marginRight: 8,
                                            borderRadius: 4,
                                        }}
                                        onError={(e) => {
                                            e.currentTarget.src = "/placeholder.png";
                                        }}
                                    />
                                    <div>
                                        <div>{item.title}</div>
                                        <div style={{ fontSize: "0.9em", color: "#666" }}>
                                            {item.price.toLocaleString()}원
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {coords &&
                    selectedLocation !== "전체" &&
                    selectedLocation !== "동네 설정" && (
                        <div className="search-bar">
                            <span className="radius-label">검색반경</span>
                            <select
                                className="radius-select"
                                value={radius}
                                onChange={(e) => setRadius(Number(e.target.value))}
                            >
                                {radiusOptions.map((km) => (
                                    <option key={km} value={km}>
                                        {km}km
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                <img
                    src={searchIcon}
                    className="search-icon clickable"
                    alt="search"
                    style={{ cursor: "pointer" }}
                    onClick={handleSearchSubmit}
                />
            </form>
        </>
    );
}
