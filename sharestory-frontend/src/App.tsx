import { useCallback, useEffect, useState } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ProductList from './pages/ProductList';
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
import { useAuth } from "./contexts/useAuth.ts";
import ProtectedRoute from "./components/ProtectedRoute";
import PointList from "./components/mypage/PointList";
import MyItems from "./components/mypage/MyItems.tsx";
import ProfileCard from "./components/mypage/ProfileCard.tsx";
import PointModal from "./components/PointModal.tsx";
import SafeTradeItems from "./components/SafeTradeItems.tsx";
import SafeTradeDetail from "./pages/SafeTradeDetail";

function AppLayout({
                       user,
                       setUser,
                   }: {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}) {
    const { openLogin } = useAuth();
    return (
        <div className="App">
            <div className="heaerset">
                <Header user={user} onLoginClick={openLogin} setUser={setUser} />
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
    const [isAuthLoading, setIsAuthLoading] = useState(true); // ✅ 추가

    const { currentOpenRoomId, setUnreadCounts, setLastMessages } = useChatContext();
    const API_URL = import.meta.env.VITE_API_URL || "";
    const { openLogin } = useAuth();
    const [isPointModalOpen, setIsPointModalOpen] = useState(false);

    const fetchMe = useCallback(
        async (forceLogin = false) => {
            try {
                setIsAuthLoading(true); // 👈 시작
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

            // 3) Refresh 실패
            setUser(null);
            if (forceLogin) openLogin();
        },
        [API_URL, openLogin]
    );

    useEffect(() => {
        (async () => {
            await fetchMe(false);
            setIsAuthLoading(false); // 👈 끝
        })();
    }, [fetchMe]);

    // ✅ 전역 WebSocket 연결
    useEffect(() => {
        if (!user?.id) return;
        connectGlobal(user.id, (msg) => {
            console.log("📩 글로벌 새 메시지:", msg);

            const roomId = Number(msg.roomId);
            const normalized =
                msg.type === "IMAGE"
                    ? "[사진]"
                    : msg.type === "LOCATION_MAP"
                        ? "[지도]"
                        : msg.content;

            // ✅ 마지막 메시지 갱신
            setLastMessages((prev) => {
                const updated = {
                    ...prev,
                    [roomId]: { content: normalized, updatedAt: msg.createdAt },
                };
                return updated;
            });

            // ✅ 현재 열려있지 않은 방이면 unread 증가
            if (roomId !== currentOpenRoomId) {
                setUnreadCounts((prev) => ({
                    ...prev,
                    [roomId]: (prev[roomId] || 0) + 1,
                }));
            }
        });

        return () => {
            disconnect();
        };
    }, [user?.id, currentOpenRoomId, setUnreadCounts, setLastMessages]);

    useEffect(() => {
        const fetchUnreadCounts = async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/rooms`, {
                credentials: "include",
            });
            if (res.ok) {
                const rooms = await res.json();
                const counts: Record<number, number> = {};
                rooms.forEach((room: { roomId: number; unreadCount: number }) => {
                    counts[room.roomId] = room.unreadCount;
                });
                setUnreadCounts(counts);
            }
        };

        const handler = () => fetchUnreadCounts();
        window.addEventListener("login-success", handler);

        return () => window.removeEventListener("login-success", handler);
    }, [setUnreadCounts]);

    return (
        <>
            <Routes>
                <Route element={<AppLayout user={user} setUser={setUser} />}>
                    {/* 게스트 접근 가능 라우트 */}
                    <Route index element={<ProductList />} />
                    <Route path="/items/:id" element={<ProductDetail />} />
                    <Route path="/search" element={<SearchPage />} />

                    {/* 로그인 필수 라우트 */}
                    <Route
                        path="/safe-items/:id"
                        element={
                            <ProtectedRoute user={user} isAuthLoading={isAuthLoading}>
                                <SafeTradeDetail />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/registerItem"
                        element={
                            <ProtectedRoute user={user} isAuthLoading={isAuthLoading}>
                                <ItemRegister />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/items/:id/edit"
                        element={
                            <ProtectedRoute user={user} isAuthLoading={isAuthLoading}>
                                <ItemEdit />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/mypage"
                        element={
                            <ProtectedRoute user={user} isAuthLoading={isAuthLoading}>
                                <MyPage user={user} setUser={setUser} />
                            </ProtectedRoute>
                        }
                    >
                        <Route
                            index
                            element={
                                <>
                                    <ProfileCard
                                        username={user?.nickname ?? ""}
                                        email={user?.email ?? ""}
                                        provider={user?.role ?? ""}
                                        point={user?.points ?? 0}
                                        totalTrades={0}
                                        onChargeClick={() => setIsPointModalOpen(true)}
                                        onEditClick={() => alert("프로필 수정")}
                                    />
                                    <MyItems />
                                    <SafeTradeItems />
                                </>
                            }
                        />
                        <Route path="items" element={<MyItems />} />
                        <Route
                            path="points"
                            element={
                                <ProtectedRoute user={user} isAuthLoading={isAuthLoading}>
                                    <PointList userId={user?.id ?? 0} />
                                </ProtectedRoute>
                            }
                        />
                    </Route>

                    <Route
                        path="/oauth2/redirect"
                        element={<OAuth2Redirect onLogin={fetchMe} />}
                    />
                </Route>
            </Routes>
            <PointModal
                isOpen={isPointModalOpen}
                onClose={() => setIsPointModalOpen(false)}
                points={user?.points ?? 0}
                user={user}
                setPoints={(newBalance: number) => {
                    setUser((prev) => (prev ? { ...prev, points: newBalance } : prev));
                }}
            />
            <GlobalChat />
        </>
    );
}
