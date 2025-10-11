import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Header.css";
import type { User } from "../types/user";
import logo from "../images/logo.png";
import LocationSelector from "./LocationSelector";
import PointModal from "./PointModal";
import { useChatContext } from "../contexts/ChatContext";
import { useNotification } from "../contexts/useNotification";

interface NotificationItem {
    id: number;
    message: string;
    isRead?: boolean;
    createdAt: string;
    referenceId?: number;
}

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

    // ✅ 드롭다운 및 모달 상태
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotiOpen, setIsNotiOpen] = useState(false);
    const [isPointModalOpen, setIsPointModalOpen] = useState(false);

    // ✅ ref
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const notiRef = useRef<HTMLDivElement | null>(null);

    // ✅ Context
    const { totalUnread, toggleChat } = useChatContext();
    const { notifications, markAsRead, setNotifications } = useNotification();

    // ✅ 읽지 않은 알림 개수
    const unreadNotiCount = notifications.filter((n) => !n.isRead).length;

    // ✅ 판매하기 클릭
    const handleProductRegisterClick = (e: React.MouseEvent) => {
        e.preventDefault();
        navigate("/registerItem");
    };

    // ✅ 로그아웃
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

    // ✅ 드롭다운 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(target) &&
                notiRef.current &&
                !notiRef.current.contains(target)
            ) {
                setIsDropdownOpen(false);
                setIsNotiOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ✅ 알림 클릭 시 읽음 + 이동
    const handleNotificationClick = async (noti: NotificationItem) => {
        if (!noti) return;

        try {
            // 1️⃣ 로컬 상태 즉시 반영 (뱃지 실시간 감소)
            setNotifications((prev) =>
                prev.map((n) => (n.id === noti.id ? { ...n, isRead: true } : n))
            );

            // 2️⃣ 서버 DB에 PATCH 요청
            await markAsRead(noti.id);

            // 3️⃣ 드롭다운 닫기
            setIsNotiOpen(false);

            // 4️⃣ 관련 페이지 이동
            if (noti.referenceId) {
                navigate(`/auction/${noti.referenceId}`);
            }
        } catch (err) {
            console.error("❌ 알림 클릭 처리 실패:", err);
        }
    };

    useEffect(() => {
        console.log("🔁 Header 리렌더 - 알림 수:", unreadNotiCount);
    }, [unreadNotiCount]);

    return (
        <>
            <header className="header">
                {/* 🔹 로고 */}
                <Link to="/" className="logo">
                    <img src={logo} alt="Logo" />
                </Link>

                {/* 🔹 위치 선택 */}
                <div className="search-area">
                    <LocationSelector onLoginClick={onLoginClick} />
                </div>

                {/* 🔹 메뉴 영역 */}
                <div className="menu-links">
                    {user ? (
                        <>
                            {/* 💬 채팅 */}
                            <div className="chat-link-wrapper">
                                <div
                                    className="chat-icon-container"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleChat();
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
                                        toggleChat();
                                    }}
                                >
                                    채팅하기
                                </a>
                            </div>

                            {/* 🔔 알림 */}
                            <div
                                className="notification-wrapper"
                                ref={notiRef}
                                style={{ position: "relative" }}
                            >
                                <button
                                    className="notification-btn"
                                    onClick={() => setIsNotiOpen((prev) => !prev)}
                                >
                                    <i className="bi-bell" style={{ fontSize: "20px" }}></i>
                                    {unreadNotiCount > 0 && (
                                        <span className="notification-badge">
                                            {unreadNotiCount}
                                        </span>
                                    )}
                                </button>

                                {/* 🔹 알림 드롭다운 */}
                                {isNotiOpen && (
                                    <div className="notification-dropdown">
                                        {notifications.length === 0 ? (
                                            <div className="notification-empty">
                                                새 알림이 없습니다.
                                            </div>
                                        ) : (
                                            notifications.slice(0, 5).map((noti) => (
                                                <div
                                                    key={noti.id}
                                                    className={`notification-item ${noti.isRead ? "read" : "unread"}`}
                                                    onClick={() => handleNotificationClick(noti)} // ✅ 클릭 시 처리
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <p className="notification-message">{noti.message}</p>
                                                    <span className="notification-time">
            {new Date(noti.createdAt).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
            })}
          </span>
                                                </div>
                                            ))
                                        )}

                                        {notifications.length > 5 && (
                                            <Link to="/notifications" className="notification-more">
                                                더보기 →
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>

                            <span className="divider">|</span>

                            {/* 🛍 판매하기 */}
                            <div className="menu-item">
                                <i className="bi-bag-dash"></i>
                                <a href="/registerItem" onClick={handleProductRegisterClick}>
                                    판매하기
                                </a>
                            </div>

                            <span className="divider">|</span>

                            {/* 👤 사용자 드롭다운 */}
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
                                        <button
                                            onClick={handleLogout}
                                            className="dropdown-item logout"
                                        >
                                            로그아웃
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* 비로그인 상태 */}
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
                                        onLoginClick();
                                    }}
                                >
                                    채팅하기
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </header>

            {/* 💰 포인트 모달 */}
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
