import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter as Router, Outlet, Route, Routes } from 'react-router-dom';
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
import MyPage from "./pages/MyPage";
import OAuth2Redirect from "./pages/OAuth2Redirect.tsx";
import {useAuth} from "./contexts/useAuth.ts";
import ProtectedRoute from "./components/ProtectedRoute";
import PointList from "./components/mypage/PointList";
import MyItems from "./components/mypage/MyItems.tsx";
import ProfileCard from "./components/mypage/ProfileCard.tsx";

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
    const { openLogin } = useAuth();

    const fetchMe = useCallback(
        async (forceLogin = false) => {
            try {
                // 1) 사용자 정보 조회
                const res = await fetch(`${API_URL}/api/main`, { credentials: "include" });
                if (res.ok) {
                    const data = await res.json();

                    if (data.authenticated) {
                        setUser(data);
                        return;
                    } else {
                        setUser(null);
                        if (forceLogin) openLogin();
                        return;
                    }
                }
            } catch (err) {
                console.error("❌ /api/main 요청 실패:", err);
                setUser(null);
                if (forceLogin) openLogin();
                return;
            }

            // 2) Access 만료 → Refresh 시도
            try {
                const rf = await fetch(`${API_URL}/auth/token/refresh`, {
                    method: "POST",
                    credentials: "include",
                });

                if (rf.ok) {
                    const res2 = await fetch(`${API_URL}/api/main`, { credentials: "include" });
                    if (res2.ok) {
                        const data2 = await res2.json();
                        if (data2.authenticated) {
                            setUser(data2);
                            return;
                        }
                    }
                }
            } catch (err) {
                console.error("❌ /auth/token/refresh 요청 실패:", err);
            }

            // 3) Refresh 실패 → 무조건 로그아웃 처리
            setUser(null);
            if (forceLogin) openLogin();
        },
        [API_URL, openLogin]
    );


    useEffect(() => {
        fetchMe(); // 기본값 false → 로그인 안 해도 모달 안뜸
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
                    {/* 게스트 접근 가능 라우트 */}
                    <Route index element={<ProductList />} />
                    <Route path="/items/:id" element={<ProductDetail />} />
                    <Route path="/search" element={<SearchPage />} />

                    {/* 로그인 필수 라우트 */}
                    <Route path="/registerItem" element={<ProtectedRoute user={user}><ItemRegister /></ProtectedRoute>} />
                    <Route path="/items/:id/edit" element={<ProtectedRoute user={user}><ItemEdit /></ProtectedRoute>} />

                    <Route
                        path="/mypage"
                        element={<ProtectedRoute user={user}><MyPage user={user} setUser={setUser} /></ProtectedRoute>}
                    >
                        <Route
                            index
                            element={
                                <ProfileCard
                                    username={user?.nickname ?? ""}
                                    email={user?.email ?? ""}
                                    provider={user?.role ?? ""}
                                    point={user?.points ?? 0}
                                    totalTrades={0}
                                    onChargeClick={() => setIsLoginOpen(true)}
                                    onEditClick={() => alert("프로필 수정")}
                                />
                            }
                        />
                        <Route path="items" element={<MyItems />} />
                        <Route path="points" element={<ProtectedRoute user={user}><PointList userId={user?.id ?? 0} /></ProtectedRoute>} />
                    </Route>

                    {/* 로그인 직후 리다이렉트 */}
                    <Route path="/oauth2/redirect" element={<OAuth2Redirect onLogin={fetchMe} />} />
                </Route>
            </Routes>

            <GlobalChat />
            <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </Router>
    );
}
