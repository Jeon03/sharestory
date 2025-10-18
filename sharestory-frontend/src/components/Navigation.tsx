import { useRef, useState } from 'react';
import '../css/Navigation.css';
import { Link } from "react-router-dom";
import Category from './Category'; // ✅ Category 컴포넌트 불러오기

function Navigation() {
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>(''); // ✅ 선택된 카테고리
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setShowDropdown(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setShowDropdown(false);
        }, 300);
    };

    const handleMenuClick = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setShowDropdown((prev) => !prev);
    };

    return (
        <nav className="nav">
            <div className="container nav-inner">
                {/* ☰ 버튼 및 드롭다운 */}
                <div
                    className="menu-area"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <button
                        className="menu-icon"
                        onClick={handleMenuClick}
                        aria-label="카테고리 메뉴"
                    >
                        ☰
                    </button>

                    {/* ✅ 드롭다운 내부에 Category 컴포넌트 삽입 */}
                    <div
                        className={`dropdown-wrapper ${showDropdown ? 'active' : ''}`}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <Category
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                            enableNavigation={true}
                        />
                    </div>
                </div>

                {/* 상단 메뉴 */}
                <Link to="/">중고거래</Link>
                <Link to="/auction">물품경매</Link>
                <Link to="/auction/register">경매물품등록</Link>
                <Link to="/community">동네생활</Link>
            </div>
        </nav>
    );
}

export default Navigation;
