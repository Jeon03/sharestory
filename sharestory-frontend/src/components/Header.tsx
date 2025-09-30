// Header.tsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Header.css";
import type { User } from "../types/user";
import logo from "../images/logo.png";
import LocationSelector from "./LocationSelector";
import PointModal from "./PointModal";
import { useChatContext } from "../contexts/ChatContext";

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
    const [isPointModalOpen, setIsPointModalOpen] = useState(false);

    // 🔹 toggleChat 사용
    const { totalUnread, toggleChat } = useChatContext();

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
                window.location.reload();
            } else {
                alert("로그아웃 실패");
            }
        } catch (err) {
            console.error("❌ 로그아웃 중 오류:", err);
            setUser(null);
            navigate("/");
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

    return (
        <>
            <header className="header">
                <Link to="/" className="logo">
                    <img src={logo} alt="Logo" />
                </Link>

                <div className="search-area">
                    <LocationSelector onLoginClick={onLoginClick} />
                </div>

                <div className="menu-links">
                    {user ? (
                        <>
                            {/* 🔹 채팅 */}
                            <div className="chat-link-wrapper">
                                <div
                                    className="chat-icon-container"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleChat(); // ✅ 열기/닫기 토글
                                    }}
                                >
                                    <i className="bi-chat-dots"></i>
                                    {totalUnread > 0 && (
                                        <span className="chat-alert-dot">{totalUnread}</span>
                                    )}
                                </div>

                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleChat(); // ✅ 열기/닫기 토글
                                    }}
                                >
                                    채팅하기
                                </a>
                            </div>

                            <span className="divider">|</span>

                            {/* 🔹 판매하기 */}
                            <div className="menu-item">
                                <i className="bi-bag-dash"></i>
                                <a href="/registerItem" onClick={handleProductRegisterClick}>
                                    판매하기
                                </a>
                            </div>
                            <span className="divider">|</span>
                                <div className="menu-item">
                                <i className="bi-bag-dash"></i>
                                <a href="/auctionRegister" onClick={handleProductRegisterClick}>
                                    경매물품 등록하기
                                </a>
                            </div>

                            <span className="divider">|</span>

                            {/* 🔹 사용자 메뉴 */}
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
                                            <div className="point-value2">
                                                {(user?.points ?? 0).toLocaleString()} P
                                            </div>
                                        </button>
                                        <button onClick={handleLogout} className="dropdown-item logout">
                                            로그아웃
                                        </button>
                                    </div>
                                )}
                            </div>
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
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onLoginClick(); // 비로그인 → 채팅 클릭 시 로그인 모달 열기
                                    }}
                                >
                                    채팅하기
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </header>

            {/* 🔹 포인트 모달 */}
            <PointModal
                isOpen={isPointModalOpen}
                onClose={() => setIsPointModalOpen(false)}
                points={user?.points ?? 0}
                user={user}
                setPoints={(newBalance: number) => {
                    setUser((prev) => (prev ? { ...prev, points: newBalance } : prev));
                }}
            />
        </>
    );
}
