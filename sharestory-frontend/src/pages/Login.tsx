import type { MouseEvent } from "react"; // ⭐ 타입 전용 import
import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/Login.module.css";

// 프로젝트 내부 이미지 경로 권장 (src/images/*)
import LogoImage from "../images/logo.png";
import GoogleLoginImage from "../images/googleLogin.png";
import NaverLoginImage from "../images/naverLogin.png";
import KakaoLoginImage from "../images/kakaoLogin.png";

interface LoginProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess?: () => void;
}

function Login({ isOpen, onClose, onLoginSuccess }: LoginProps) {
    const navigate = useNavigate();

    // 스크롤 잠금
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "auto";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    // 모달 내부 클릭 시 오버레이로 전파 막기
    const stop = useCallback((e: MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
    }, []);

    // OAuth 리다이렉트 (Vite proxy 쓰면 상대경로 사용 권장)
    const goOAuth = useCallback((provider: "google" | "naver" | "kakao") => {
        const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:8081";
        window.location.href = `${backendUrl}/oauth2/authorization/${provider}`;
    }, []);

    // ✅ 로그인 성공 감지 (예시: URL에 success 쿼리 파라미터가 있으면 성공 처리)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("login") === "success") {
            onLoginSuccess?.(); // 🔹 AuthProvider에 이벤트 알림
            onClose();
            navigate("/"); // 메인으로 이동
        }
    }, [onLoginSuccess, onClose, navigate]);

    if (!isOpen) return null;

    return (
        <>
            {/* 오버레이 */}
            <div
                className={styles.overlay}
                onClick={() => {
                    onClose();
                    navigate("/");
                }}
            ></div>

            {/* 모달 */}
            <div
                className={styles.popup}
                role="dialog"
                aria-modal="true"
                aria-labelledby="login-title"
                onClick={stop}
            >
                <div className={styles.popupNav}>
                    <button
                        className={styles.closeButton}
                        onClick={() => {
                            onClose();
                            window.location.href = "/";
                        }}
                        aria-label="닫기"
                    >
                        ×
                    </button>
                </div>

                <img className={styles.logoImage} src={LogoImage} alt="ShareStory 로고" />
                <div className={styles.text}>
                    <h2 id="login-title">쉐어토리로 중고거래 시작하기</h2>
                    간편하게 로그인하고 상품을 확인하세요!
                </div>

                <div className={styles.loginImage}>
                    <button className={styles.loginButton} onClick={() => goOAuth("google")}>
                        <img src={GoogleLoginImage} alt="Google 로그인" />
                    </button>
                    <button className={styles.loginButton} onClick={() => goOAuth("naver")}>
                        <img src={NaverLoginImage} alt="Naver 로그인" />
                    </button>
                    <button className={styles.loginButton} onClick={() => goOAuth("kakao")}>
                        <img src={KakaoLoginImage} alt="Kakao 로그인" />
                    </button>
                </div>

                <hr className={styles.loginHr} />
                <div className={styles.explanText}>
                    도움이 필요시{" "}
                    <a href="mailto:support@sharestory.example" className={styles.email}>
                        이메일
                    </a>{" "}
                    또는 고객센터 1234-5678로 문의 부탁드립니다.<br />
                    고객센터 운영시간: 09~18시 (점심시간 12~13시, 주말/공휴일 제외)
                </div>
            </div>
        </>
    );
}

export default Login;
