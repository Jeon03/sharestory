// Header.tsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Header.css";
import type { User } from "../types/user";
import logo from "../images/logo.png";
import LocationSelector from "./LocationSelector";
import ChatSlider from "./chat/ChatSlider";
import PointModal from "./PointModal";

export default function Header({
                                   user,
                                   onLoginClick,
                                   setUser,
                                   unreadCount,
                                   setUnreadCount,
                               }: {
    user: User | null;
    onLoginClick: () => void;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    unreadCount: number;
    setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}) {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [showChat, setShowChat] = useState(false);

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

    useEffect(() => {
        if (user) {
            const fetchPoints = async () => {
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/points`, {
                        credentials: "include",
                    });
                    if (response.ok) {
                        const data = await response.json();
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

    useEffect(() => {
        console.log("🔔 Header에서 받은 unreadCount:", unreadCount);
    }, [unreadCount]);

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
                            <div className="chat-link-wrapper">
                                <div
                                    className="chat-icon-container"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowChat(true); // ✅ 리스트만 열림 → 읽음 처리 X
                                    }}
                                >
                                    <i className="bi-chat-dots"></i>
                                    {unreadCount > 0 && <span className="chat-alert-dot">{unreadCount}</span>}
                                </div>

                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowChat(true); // ✅ 리스트만 열림
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

                            <div className="header-dropdown" ref={dropdownRef}>
                                <button
                                    className="dropdown-toggle"
                                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                                >
                                    {user.nickname}님 ▾
                                </button>
                                {isDropdownOpen && (
                                    <div className="header-dropdown-menu">
                                        <Link to="/mypage" className="dropdown-item">
                                            마이페이지
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setIsPointModalOpen(true);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="dropdown-item"
                                        >
                                            <div className="point-label">보유 포인트</div>
                                            <div className="point-value2">{points.toLocaleString()} P</div>
                                        </button>
                                        <button onClick={handleLogout} className="dropdown-item logout">
                                            로그아웃
                                        </button>
                                    </div>
                                )}
                            </div>

                            <ChatSlider
                                isOpen={showChat}
                                onClose={() => setShowChat(false)}
                                activeRoomId={null}
                                setUnreadCount={setUnreadCount}
                            />
                        </>
                    ) : (
                        <>
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
                                    }}
                                >
                                    채팅하기
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </header>

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
