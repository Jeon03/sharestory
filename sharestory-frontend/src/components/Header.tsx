// Header.tsx
import React, {useEffect, useRef, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import '../css/Header.css';
import type {User} from '../types/user';
import logo from '../images/logo.png';
import LocationSelector from './LocationSelector';

function ChatRoomListPanel({ onClose }: { onClose: () => void }) {
    return (
        <div className="chat-panel">
            <p>채팅방 목록 (더미)</p>
            <button onClick={onClose}>닫기</button>
        </div>
    );
}

function ChatBox({ roomId, onClose }: { roomId: string; onClose: () => void }) {
    return (
        <div className="chat-box">
            <p>채팅방 #{roomId} (더미)</p>
            <button onClick={onClose}>닫기</button>
        </div>
    );
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
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [showChatList, setShowChatList] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const handleProductRegisterClick = (e: React.MouseEvent) => {
        e.preventDefault();
        navigate('/registerItem');
    };

    const handleLogout = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
                method: 'POST',
                credentials: 'include',
            });
            if (res.ok) {
                alert('로그아웃 되었습니다.');
                setUser(null);
                navigate('/');
            } else {
                alert('로그아웃 실패');
            }
        } catch (err) {
            console.error(err);
            alert('로그아웃 중 오류 발생');
        }
    };
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
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
                        <div className="chat-link-wrapper relative" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <div style={{ position: "relative" }}>
                                <i className="bi-chat-dots"></i>
                                {unreadCount > 0 && <span className="chat-alert-dot">{unreadCount}</span>}
                            </div>
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedRoomId(null);
                                    setShowChatList(true);
                                    setUnreadCount(0);
                                }}
                            >
                                채팅하기
                            </a>
                        </div>

                        <span className="mx-2">|</span>
                        <i className="bi-bag-dash"></i>
                        <a href="/registerItem" onClick={handleProductRegisterClick}>판매하기</a>
                        <span className="mx-2">|</span>

                        {/* 드롭다운 */}
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
                                    <button onClick={handleLogout} className="dropdown-item logout">
                                        로그아웃
                                    </button>
                                </div>
                            )}
                        </div>

                        {showChatList && <ChatRoomListPanel onClose={() => setShowChatList(false)} />}
                        {selectedRoomId && <ChatBox roomId={selectedRoomId} onClose={() => setSelectedRoomId(null)} />}
                    </>
                ) : (
                    <>
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
                        <span className="divider">|</span>
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
                        <span className="divider">|</span>
                        <div className="chat-link-wrapper">
                            <i className="bi-chat-dots"></i>
                            {unreadCount > 0 && <span className="chat-alert-dot">{unreadCount}</span>}
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedRoomId(null);
                                    setShowChatList(true);
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
    );
}
