import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ProductList from './pages/ProductList';
import Login from './pages/Login';
import ItemRegister from "./pages/Item/ItemRegister";
import ProductDetail from './pages/ProductDetail';
import './css/App.css';
import type { User } from './types/user';
import { Navigate } from "react-router-dom";

interface AppLayoutProps {
    user: User | null;
    onLoginClick: () => void;
}

function AppLayout({ user, onLoginClick }: AppLayoutProps) {
    return (
        <div className="App">
            <div className="heaerset">
                <Header user={user} onLoginClick={onLoginClick} />
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
    const fetchMe = useCallback(async () => {
        try {
            // 1) 사용자 정보 조회
            const res = await fetch(`${API_URL}/api/main`, { credentials: 'include' });
            if (res.ok) {
                const data: User | null = await res.json();
                setUser(data);
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
                    const data2: User | null = await res2.json();
                    setUser(data2);
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

    return (
        <Router>
            <Routes>
                <Route
                    element={
                        <AppLayout user={user} onLoginClick={() => setIsLoginOpen(true)} />
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
