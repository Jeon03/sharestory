import {useCallback, useEffect, useState} from 'react';
import {BrowserRouter as Router, Navigate, Outlet, Route, Routes} from 'react-router-dom';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ProductList from './pages/ProductList';
import Login from './pages/Login';
import ItemRegister from "./pages/Item/ItemRegister";
import ProductDetail from './pages/ProductDetail';
import './css/App.css';
import type {User} from './types/user';

interface AppLayoutProps {
    user: User | null;
    onLoginClick: () => void;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

function AppLayout({ user, onLoginClick, setUser }: AppLayoutProps) {
    return (
        <div className="App">
            <div className="heaerset">
                <Header user={user} onLoginClick={onLoginClick} setUser={setUser} />
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

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";

    // 로그인 상태 조회 + 1회 토큰 리프레시 재시도
// 로그인 상태 조회 + 1회 토큰 리프레시 재시도
    const fetchMe = useCallback(async () => {
        try {
            // 1) 사용자 정보 조회
            const res = await fetch(`${API_URL}/api/main`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();

                // ✅ 로그인 여부 판별
                if (data.authenticated) {
                    setUser(data); // 로그인 사용자
                } else {
                    setUser(null); // 비로그인 사용자
                }
                return;
            }

            // 2) 실패 → 리프레시 한번 시도
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
                    } else {
                        setUser(null);
                    }
                    return;
                }
            }

            // 3) 실패 → 비로그인 처리
            setUser(null);
        } catch {
            setUser(null);
        }
    }, [API_URL]);

    useEffect(() => {
        fetchMe();
    }, [fetchMe]);


    useEffect(() => {
        fetchMe();
    }, [fetchMe]);

    return (
        <Router>
            <Routes>
                <Route
                    element={
                        <AppLayout
                            user={user}
                            onLoginClick={() => setIsLoginOpen(true)}
                            setUser={setUser}   // ✅ 전달
                        />
                    }
                >

                    <Route index element={<ProductList />} />
                    <Route path="/items/:id" element={<ProductDetail />} />
                    <Route path="/registerItem" element={user ? <ItemRegister /> : <Navigate to="/" replace />}/>

                </Route>
            </Routes>

            <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </Router>
    );

}
