import { useRef, useState } from "react";
import "../css/Navigation.css";
import { Link } from "react-router-dom";

function Navigation() {
    const [showDropdown, setShowDropdown] = useState(false);
    const [dummyCategory, setDummyCategory] = useState<string | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setShowDropdown(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setShowDropdown(false);
        }, 500);
    };

    return (
        <nav className="nav">
            <div className="container nav-inner">
                <div
                    className="menu-area"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <button className="menu-icon">☰</button>

                    {showDropdown && (
                        <div
                            className="dropdown-wrapper"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            style={{
                                background: "#fff",
                                border: "1px solid #ccc",
                                padding: "1rem",
                                marginTop: "8px",
                            }}
                        >
                            <p style={{ margin: 0, fontSize: "14px" }}>
                                카테고리 드롭다운 (준비중)
                            </p>
                            <button
                                onClick={() => setDummyCategory("패션")}
                                style={{ display: "block", marginTop: "8px" }}
                            >
                                패션 선택
                            </button>
                            <button
                                onClick={() => setDummyCategory("가전")}
                                style={{ display: "block", marginTop: "4px" }}
                            >
                                가전 선택
                            </button>
                            {dummyCategory && (
                                <p
                                    style={{
                                        marginTop: "8px",
                                        fontSize: "13px",
                                        color: "gray",
                                    }}
                                >
                                    선택됨: {dummyCategory}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <Link to="/usedproduct">중고거래</Link>
                <Link to="/auction">물품경매</Link>
                <Link to="/auctionItemRegister">경매등록</Link>
            </div>
        </nav>
    );
}

export default Navigation;
