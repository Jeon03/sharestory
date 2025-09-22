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
import ChatSlider from "./components/chat/ChatSlider";

function AppLayout({
                       user,
                       onLoginClick,
                       setUser,
                   }: {
    user: User | null;
    onLoginClick: () => void;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}) {
    return (
        <div className="App">
            <div className="heaerset">
                <Header
                    user={user}
                    onLoginClick={onLoginClick}
                    setUser={setUser}
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

// ✅ 전역 ChatSlider 렌더링
function GlobalChat() {
    const { isChatOpen, closeChat, currentOpenRoomId } = useChatContext();
    return (
        <ChatSlider
            isOpen={isChatOpen}
            onClose={closeChat}
            activeRoomId={currentOpenRoomId}
        />
    );
}


export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const { currentOpenRoomId, setUnreadCounts, setLastMessages } = useChatContext();
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
                        const unreadRes = await fetch(`${API_URL}/api/chat/unreadCounts`, {
                            credentials: "include",
                        });
                        if (unreadRes.ok) {
                            const unreadData = await unreadRes.json();
                            console.log("📩 서버에서 가져온 unreadCounts:", unreadData);
                            setUnreadCounts(unreadData.unreadCounts || {});
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

                        const unreadRes = await fetch(`${API_URL}/api/chat/unreadCounts`, {
                            credentials: "include",
                        });
                        if (unreadRes.ok) {
                            const unread = await unreadRes.json();
                            setUnreadCounts(unread.unreadCounts || {});
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


        connectGlobal(
            user.id,
            (msg) => {
                console.log("📩 글로벌 새 메시지:", msg);

                const roomId = Number(msg.roomId);
                const normalized =
                    msg.type === "IMAGE" ? "[사진]" :
                        msg.type === "LOCATION_MAP" ? "[지도]" :
                            msg.content;

                // ✅ 마지막 메시지 갱신
                setLastMessages((prev) => {
                    const updated = {
                        ...prev,
                        [roomId]: { content: normalized, updatedAt: msg.createdAt },
                    };
                    console.log("💾 lastMessages 업데이트:", updated);
                    return updated;
                });

                // ✅ 현재 열려있지 않은 방이면 unread 증가
                if (roomId !== currentOpenRoomId) {
                    setUnreadCounts((prev) => ({
                        ...prev,
                        [roomId]: (prev[roomId] || 0) + 1,
                    }));
                }
            }
        );

        return () => {
            disconnect();
        };
    }, [user?.id, currentOpenRoomId, setUnreadCounts, setLastMessages]);

    return (
        <Router>
            <Routes>
                <Route
                    element={
                        <AppLayout
                            user={user}
                            onLoginClick={() => setIsLoginOpen(true)}
                            setUser={setUser}
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
            <GlobalChat />
            <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </Router>
    );
}
