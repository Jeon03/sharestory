// Header.tsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Header.css";
import type { User } from "../types/user";
import logo from "../images/logo.png";
import LocationSelector from "./LocationSelector";
import ChatSlider from "./chat/ChatSlider";
import PointModal from "./PointModal"; // 1. Import PointModal

export default function Header({
                                   user,
                                   onLoginClick,
                                   setUser,
                               }: {
    user: User | null;
    onLoginClick: () => void;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}) {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // 2. Add state for points and modal
    const [points, setPoints] = useState(0);
    const [isPointModalOpen, setIsPointModalOpen] = useState(false);

    const handleProductRegisterClick = (e: React.MouseEvent) => {
        e.preventDefault();
        navigate("/registerItem");
    };

    const handleLogout = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
                method: "POST",
                credentials: "include",
            });
            if (res.ok) {
                alert("로그아웃 되었습니다.");
                setUser(null);
                navigate("/");
            } else {
                alert("로그아웃 실패");
            }
        } catch (err) {
            console.error(err);
            alert("로그아웃 중 오류 발생");
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 3. Fetch points when user is logged in
    useEffect(() => {
        if (user) {
            const fetchPoints = async () => {
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/points`, {
                         credentials: "include",
                    });
                    if (response.ok) {
                        const data = await response.json();
                        // API가 { "points": 12345 } 형태의 응답을 보낸다고 가정합니다.
                        setPoints(data.points || 0);
                    } else {
                        console.error("Failed to fetch points.");
                    }
                } catch (error) {
                    console.error("Error fetching points:", error);
                }
            };
            fetchPoints();
        }
    }, [user]);

    return (
        <>
            <header className="header">
                <Link to="/" className="logo">
                    <img src={logo} alt="Logo" />
                </Link>

                <div className="search-area">
                    <LocationSelector />
                </div>

                <div className="menu-links">
                    {user ? (
                        <>
                            <div className="chat-link-wrapper" style={{ position: "relative" }}>
                                <i className="bi-chat-dots"></i>
                                {unreadCount > 0 && <span className="chat-alert-dot">{unreadCount}</span>}
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowChat(true);
                                        setUnreadCount(0);
                                    }}
                                >
                                    채팅하기
                                </a>
                            </div>

                            <span className="divider">|</span>

                            <div className="menu-item">
                                <i className="bi-bag-dash"></i>
                                <a href="/registerItem" onClick={handleProductRegisterClick}>
                                    판매하기
                                </a>
                            </div>

                            <span className="divider">|</span>

                            {/* 드롭다운 */}
                            <div className="header-dropdown" ref={dropdownRef}>
                                <button
                                    className="dropdown-toggle"
                                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                                >
                                    {user.nickname}님 ▾
                                </button>
                                {isDropdownOpen && (
                                    // 4. 드롭다운 메뉴 수정
                                    <div className="header-dropdown-menu">
                                        <Link to="/mypage" className="dropdown-item">
                                            마이페이지
                                        </Link>
                                        <button onClick={() => {
                                            setIsPointModalOpen(true);
                                            setIsDropdownOpen(false); // 모달을 열 때 드롭다운을 닫습니다.
                                        }} className="dropdown-item">
                                            <div className="point-label">보유 포인트</div>
                                            <div className="point-value2">{points.toLocaleString()} P</div>
                                        </button>
                                        <button onClick={handleLogout} className="dropdown-item logout">
                                            로그아웃
                                        </button>
                                    </div>
                                )}
                            </div>

                            <ChatSlider isOpen={showChat} onClose={() => setShowChat(false)} />
                        </>
                    ) : (
                        <>
                            {/* 로그인하지 않았을 때의 메뉴 */}
                            <div className="menu-item">
                            <i className="bi-person"></i>
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onLoginClick();
                                }}
                            >
                                로그인
                            </a>
                        </div>

                        <span className="divider">|</span>

                        <div className="menu-item">
                            <i className="bi-bag-dash"></i>
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onLoginClick();
                                }}
                            >
                                판매하기
                            </a>
                        </div>

                        <span className="divider">|</span>

                        <div className="chat-link-wrapper" style={{ position: "relative" }}>
                            <i className="bi-chat-dots"></i>
                            {unreadCount > 0 && <span className="chat-alert-dot">{unreadCount}</span>}
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowChat(true);
                                    setUnreadCount(0);
                                }}
                            >
                                채팅하기
                            </a>
                        </div>
                        </>
                    )}
                </div>
            </header>

            {/* 5. PointModal 렌더링 */}
            <PointModal
                isOpen={isPointModalOpen}
                onClose={() => setIsPointModalOpen(false)}
                points={points}
                user={user}
                setPoints={setPoints}
            />
        </>
    );
}
