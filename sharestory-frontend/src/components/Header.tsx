import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Header.css";
import type { User } from "../types/user";
import logo from "../images/logo.png";
import LocationSelector from "./LocationSelector";
import PointModal from "./PointModal";
import { useChatContext } from "../contexts/ChatContext";
// ✅ [추가] 알림 기능에 필요한 요소들을 import 합니다.
import { Bell } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import { getUnreadNotificationCount, markAllNotificationsAsRead } from '../services/notificationApi';

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

    const { totalUnread, toggleChat } = useChatContext();

    // ✅ [추가] 알림 관련 상태
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const notificationRef = useRef<HTMLDivElement | null>(null);

    // ✅ [추가] 로그인 시 읽지 않은 알림 개수를 가져오는 로직
    useEffect(() => {
        if (user) {
            const fetchUnreadCount = async () => {
                try {
                    const data = await getUnreadNotificationCount();
                    setUnreadCount(data.count);
                } catch (error) {
                    console.error('Failed to fetch unread count:', error);
                }
            };
            fetchUnreadCount();
        }
    }, [user]);

    const handleProductRegisterClick = (e: React.MouseEvent) => {
        e.preventDefault();
        navigate("/registerItem");
    };

    const handleAuctionRegisterClick = (e: React.MouseEvent) => {
        e.preventDefault();
        navigate("/auctionRegister");
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

    // ✅ [추가] 알림 아이콘 클릭 핸들러
    const handleNotificationClick = async () => {
        setShowNotifications(prev => !prev);
        if (!showNotifications && unreadCount > 0) {
            try {
                await markAllNotificationsAsRead();
                setUnreadCount(0);
            } catch (error) {
                console.error('Failed to mark notifications as read:', error);
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
                setShowNotifications(false);
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
                            {/* ✅ [추가] 알림 아이콘 */}
                            <div className="notification-icon-wrapper" ref={notificationRef}>
                                <div className="chat-icon-container" onClick={handleNotificationClick}>
                                    <Bell size={20} />
                                    {unreadCount > 0 && <span className="chat-alert-dot">{unreadCount}</span>}
                                </div>
                                {showNotifications && <NotificationDropdown />}
                            </div>
                            <span className="divider">|</span>

                            {/* 채팅 */}
                            <div className="chat-link-wrapper">
                                <div className="chat-icon-container" onClick={toggleChat}>
                                    <i className="bi-chat-dots"></i>
                                    {totalUnread > 0 && <span className="chat-alert-dot">{totalUnread}</span>}
                                </div>
                                <a href="#" onClick={(e) => { e.preventDefault(); toggleChat(); }}>
                                    채팅하기
                                </a>
                            </div>
                            <span className="divider">|</span>

                            {/* 판매하기 */}
                            <div className="menu-item">
                                <i className="bi-bag-dash"></i>
                                <a href="/registerItem" onClick={handleProductRegisterClick}>판매하기</a>
                            </div>
                            <span className="divider">|</span>

                            {/* 경매물품 등록하기 */}
                            <div className="menu-item">
                                <i className="bi-bag-dash"></i>
                                <a href="/auctionRegister" onClick={handleAuctionRegisterClick}>경매물품 등록하기</a>
                            </div>
                            <span className="divider">|</span>

                            {/* 사용자 메뉴 */}
                            <div className="header-dropdown" ref={dropdownRef}>
                                <button className="dropdown-toggle" onClick={() => setIsDropdownOpen((prev) => !prev)}>
                                    {user.nickname}님 ▾
                                </button>
                                {isDropdownOpen && (
                                    <div className="header-dropdown-menu">
                                        <Link to="/mypage" className="dropdown-item">마이페이지</Link>
                                        <button onClick={() => { setIsPointModalOpen(true); setIsDropdownOpen(false); }} className="dropdown-item">
                                            <div className="point-label">보유 포인트</div>
                                            <div className="point-value2">{(user?.points ?? 0).toLocaleString()} P</div>
                                        </button>
                                        <button onClick={handleLogout} className="dropdown-item logout">로그아웃</button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        // ✅ [복구] 비로그인 상태일 때 보여줄 버튼들을 다시 추가했습니다.
                        <>
                            <div className="menu-item">
                                <i className="bi-person"></i>
                                <a href="#" onClick={(e) => { e.preventDefault(); onLoginClick(); }}>로그인</a>
                            </div>
                            <span className="divider">|</span>
                            <div className="menu-item">
                                <i className="bi-bag-dash"></i>
                                <a href="#" onClick={(e) => { e.preventDefault(); onLoginClick(); }}>판매하기</a>
                            </div>
                            <span className="divider">|</span>
                            <div className="chat-link-wrapper" style={{ position: "relative" }}>
                                <i className="bi-chat-dots"></i>
                                <a href="#" onClick={(e) => { e.preventDefault(); onLoginClick(); }}>채팅하기</a>
                            </div>
                        </>
                    )}
                </div>
            </header>

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