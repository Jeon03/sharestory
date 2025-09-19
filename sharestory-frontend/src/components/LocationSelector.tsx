import React, { useEffect, useState, useRef  } from "react";
import "../css/LocationSelector.css";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import searchIcon from "../images/search.svg";
import type { ItemSummary } from "../types/item";
import "../css/SearchBar.css";
const KAKAO_ADDRESS_KEY = import.meta.env.VITE_KAKAO_ADDRESS_KEY;
import Select from "react-select";

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
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [coordsReady, setCoordsReady] = useState(false);
    const [searchAddress, setSearchAddress] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [suggestions, setSuggestions] = useState<ItemSummary[]>([]);

    const navigate = useNavigate();

    const mapRef = useRef<kakao.maps.Map | null>(null);
    const markerRef = useRef<kakao.maps.Marker | null>(null);
    const circleRefs = useRef<kakao.maps.Circle[]>([]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    // ✅ 카카오 맵 SDK 로드
    useEffect(() => {
        const script = document.createElement("script");
        const key = import.meta.env.VITE_KAKAO_REST_KEY;
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`;
        script.async = true;
        document.head.appendChild(script);
        script.onload = () => {
            window.kakao.maps.load(() => {
                console.log("✅ Kakao Map SDK 로드 완료");
            });
        };
    }, []);

    const handleCloseModal = () => {
        setIsOpen(false);
        // 지도/마커/원 초기화
        mapRef.current = null;
        markerRef.current = null;
        circleRefs.current = [];
    };

    // ✅ 지도 표시
    useEffect(() => {
        if (isOpen && coords && window.kakao) {
            window.kakao.maps.load(() => {
                const container = document.getElementById("map");
                if (!container) return;

                const newLatLng = new window.kakao.maps.LatLng(coords.lat, coords.lng);

                // 지도 초기화 (없으면 생성)
                if (!mapRef.current) {
                    mapRef.current = new window.kakao.maps.Map(container, {
                        center: newLatLng,
                        level: 6,
                    });
                } else {
                    // ✅ 모달 닫았다 열 때 강제 리레이아웃
                    mapRef.current.setCenter(newLatLng);
                    mapRef.current.relayout();
                }

                // 마커 초기화 (최초 1회만)
                if (!markerRef.current) {
                    markerRef.current = new window.kakao.maps.Marker({
                        map: mapRef.current,
                        draggable: true,
                    });

                    // ✅ 드래그 이벤트
                    window.kakao.maps.event.addListener(markerRef.current, "dragend", () => {
                        const pos = markerRef.current!.getPosition();
                        setCoords({ lat: pos.getLat(), lng: pos.getLng() });
                    });

                    // ✅ 지도 클릭 이벤트
                    window.kakao.maps.event.addListener(mapRef.current!, "click", (mouseEvent) => {
                        const latlng = mouseEvent.latLng;
                        markerRef.current!.setPosition(latlng);
                        setCoords({ lat: latlng.getLat(), lng: latlng.getLng() });
                    });
                }

                // 마커 위치 갱신

                markerRef.current.setPosition(newLatLng);
                mapRef.current.setCenter(newLatLng);

                // 원 초기화 (처음만 생성)
                if (circleRefs.current.length === 0) {
                    const circles = [1000, 5000, 10000];
                    const colors = ["#ff0000", "#00aaff", "#ffaa00"];

                    circleRefs.current = circles.map(
                        (r, i) =>
                            new window.kakao.maps.Circle({
                                map: mapRef.current!,
                                center: newLatLng,
                                radius: r,
                                strokeWeight: 2,
                                strokeColor: colors[i],
                                strokeOpacity: 0.8,
                                strokeStyle: "dashed",
                                fillColor: colors[i],
                                fillOpacity: 0.1,
                            })
                    );
                } else {
                    // 기존 원 위치만 갱신
                    circleRefs.current.forEach((circle) =>
                        circle.setOptions({ center: newLatLng })
                    );
                }
            });
        }
    }, [isOpen,coords]);

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
                `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(value)}`,
                { headers: { Authorization: `KakaoAK ${KAKAO_ADDRESS_KEY}` } }
            );
            const data: { documents: KakaoAddress[] } = await res.json();
            setSearchResults(data.documents || []);
        } catch (err) {
            console.error("주소 검색 실패", err);
        }
    };

    // ✅ 주소 선택 (지도 미리보기만)
    const handleSelectAddress = async (label: string) => {
        setSelectedLocation(label);

        try {
            const res = await fetch(
                `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(label)}`,
                { headers: { Authorization: `KakaoAK ${KAKAO_ADDRESS_KEY}` } }
            );
            const data: { documents: KakaoAddress[] } = await res.json();
            if (!data.documents?.length) {
                alert("위치 정보를 찾을 수 없습니다.");
                return;
            }

            const { y, x } = data.documents[0];
            setCoords({ lat: parseFloat(y), lng: parseFloat(x) });
        } catch (err) {
            console.error("위치 설정 실패", err);
        }
    };

    // ✅ 저장 버튼 (역지오코딩 포함)
    const handleSaveLocation = async () => {
        if (!coords) return;
        if (!isAuthenticated) {
            alert("로그인이 필요합니다.");
            return;
        }

        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.coord2Address(coords.lng, coords.lat, async (result, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
                const addressName = result[0].address.address_name;
                try {
                    await api.put("/users/location", {
                        addressName,
                        myLatitude: coords.lat,
                        myLongitude: coords.lng,
                    });
                    setSelectedLocation(addressName);
                    alert(`"${addressName}" 로 동네가 저장되었습니다.`);
                    setIsOpen(false);
                } catch (err) {
                    console.error("위치 저장 실패", err);
                }
            }
        });
    };

    // ✅ 상품 검색 키워드 변경
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

    // ✅ 검색 제출
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
                    <div className="location-selector-overlay" onClick={() => setIsOpen(false)} />

                    <div className="location-selector-modal" role="dialog" aria-modal="true">
                        <div className="location-selector-modal-header">
                            <span>지역 변경</span>
                            <button
                                className="location-selector-close-button"
                                onClick={handleCloseModal}
                                aria-label="닫기"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="location-selector-modal-body">
                            <div className="location-selector-address-box">
                                <input
                                    type="text"
                                    className="location-selector-address-input"
                                    placeholder="지역이나 동네로 검색"
                                    value={searchAddress}
                                    onChange={handleAddressChange}
                                />
                            </div>

                            {searchResults.length > 0 && (
                                <ul className="location-selector-autocomplete-suggestions">
                                    {searchResults.map((place, idx) => (
                                        <li
                                            key={idx}
                                            className="location-selector-autocomplete-item"
                                            onClick={() => handleSelectAddress(place.address_name)}
                                        >
                                            {place.address_name}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* 지도 미리보기 */}
                            {coords && <div id="map" style={{ width: "100%", height: "250px", marginTop: "10px" }} />}
                        </div>
                        {/* 저장 버튼 */}
                        <div className="location-selector-modal-footer">
                            {coords && (
                                <button className="save-location-btn" onClick={handleSaveLocation}>
                                    이 위치로 저장
                                </button>
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
                {suggestions.length > 0 && (
                    <ul className="autocomplete-list">
                        {suggestions.map((item) => (
                            <li key={item.id} className="autocomplete-item" onClick={() => navigate(`/items/${item.id}`)}>
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

                {coords && selectedLocation !== "전체" && selectedLocation !== "동네 설정" && (
                    <div className="search-bar">
                        <span className="radius-label">검색반경</span>
                        <Select
                            options={[
                                { value: 1, label: "1km" },
                                { value: 3, label: "3km" },
                                { value: 5, label: "5km" },
                                { value: 10, label: "10km" },
                            ]}
                            value={{ value: radius, label: `${radius}km` }}
                            onChange={(selected) => setRadius(selected?.value || 3)}
                            isSearchable={false}
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    minWidth: 80,
                                    minHeight: "23px",
                                    height: "23px",
                                    borderRadius: "20px",
                                    border: "none",
                                    fontSize: "13px",
                                    boxShadow: "none",
                                }),
                                valueContainer: (base) => ({
                                    ...base,
                                    height: "23px",
                                    padding: "0 8px",
                                }),
                                indicatorsContainer: (base) => ({
                                    ...base,
                                    height: "23px",
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isFocused ? "#ffec99" : "#fff",
                                    color: "#333",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    padding: "8px 12px",
                                }),
                            }}
                        />
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
