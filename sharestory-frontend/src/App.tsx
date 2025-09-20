import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ProductList from './pages/ProductList';
import Login from './pages/Login';
import ItemRegister from "./pages/Item/ItemRegister";
import ItemEdit from "./pages/Item/ItemEdit";
import ProductDetail from './pages/ProductDetail';
import SearchPage from "./pages/SearchPage";
import './css/App.css';
import type { User } from './types/user';
import { connectGlobal, disconnect } from "./services/socketClient.ts";
import { useChatContext } from "./contexts/ChatContext";

function AppLayout({
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
    return (
        <div className="App">
            <div className="heaerset">
                <Header
                    user={user}
                    onLoginClick={onLoginClick}
                    setUser={setUser}
                    unreadCount={unreadCount}
                    setUnreadCount={setUnreadCount}
                />
                <Navigation />
            </div>
            <main className="main-content">
                <div className="content-wrapper">
                    <div className="container">
                        <Outlet />
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const { currentOpenRoomId } = useChatContext(); // ✅ Context로 현재 열린 방 추적
    const API_URL = import.meta.env.VITE_API_URL || "";

    // ✅ 로그인 상태 + 서버에서 unreadCount 가져오기
    const fetchMe = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/main`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();

                if (data.authenticated) {
                    setUser(data);

                    try {
                        const unreadRes = await fetch(`${API_URL}/api/chat/unreadCount`, {
                            credentials: "include",
                        });
                        if (unreadRes.ok) {
                            const unreadData = await unreadRes.json();
                            console.log("📩 서버에서 가져온 unreadCount:", unreadData);
                            setUnreadCount(unreadData.unreadCount || 0);
                        }
                    } catch (err) {
                        console.error("안읽음 카운트 가져오기 실패:", err);
                    }
                } else {
                    setUser(null);
                }
                return;
            }

            // ❌ 실패 → 토큰 리프레시 한번 시도
            const rf = await fetch(`${API_URL}/auth/token/refresh`, {
                method: 'POST',
                credentials: 'include',
            });

            if (rf.ok) {
                const res2 = await fetch(`${API_URL}/api/main`, { credentials: 'include' });
                if (res2.ok) {
                    const data2 = await res2.json();
                    if (data2.authenticated) {
                        setUser(data2);

                        const unreadRes = await fetch(`${API_URL}/api/chat/unreadCount`, {
                            credentials: "include",
                        });
                        if (unreadRes.ok) {
                            const unread = await unreadRes.json();
                            setUnreadCount(unread.count || 0);
                        }
                    } else {
                        setUser(null);
                    }
                    return;
                }
            }

            setUser(null);
        } catch {
            setUser(null);
        }
    }, [API_URL]);

    useEffect(() => {
        fetchMe();
    }, [fetchMe]);

    // ✅ 전역 WebSocket 연결
    useEffect(() => {
        if (!user?.id) return;

        connectGlobal(user.id, (msg) => {
            console.log("📩 새 메시지 도착:", msg);

            // 현재 열려 있는 방이 아니면 카운트 증가
            if (msg.roomId !== currentOpenRoomId) {
                setUnreadCount((prev) => prev + 1);
            }
            // 현재 방이면 → ChatRoom.tsx에서 직접 읽음 처리
        });

        return () => {
            disconnect();
        };
    }, [user?.id, currentOpenRoomId]);

    return (
        <Router>
            <Routes>
                <Route
                    element={
                        <AppLayout
                            user={user}
                            onLoginClick={() => setIsLoginOpen(true)}
                            setUser={setUser}
                            unreadCount={unreadCount}
                            setUnreadCount={setUnreadCount}
                        />
                    }
                >
                    <Route index element={<ProductList />} />
                    <Route path="/items/:id" element={<ProductDetail />} />
                    <Route path="/registerItem" element={user ? <ItemRegister /> : <Navigate to="/" replace />} />
                    <Route path="/items/:id/edit" element={<ItemEdit />} />
                    <Route path="/search" element={<SearchPage />} />
                </Route>
            </Routes>

            <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </Router>
    );
}
