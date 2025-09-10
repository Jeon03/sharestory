import '../css/footer.css';

function Footer() {
    return (
        <footer className="custom-footer">
            <div className="container"> {/* ✅ 네비게이션과 동일한 너비 정렬 */}
                <div className="footer-info">
                    <strong>(주)ShareStory 사업자 정보</strong><br />
                    대표자: 전여욱 | 사업자 등록번호: 123-45-67890<br />
                    통신판매업신고번호: 제2025-서울강남-1234호<br />
                    주소: 서울특별시 강남구 테헤란로 123 4층<br />
                    대표번호: 010-1234-5678 | 이메일: support@sharestory.co.kr<br />
                    호스팅 제공자: ShareStory Cloud
                </div>
                <div className="footer-links">
                    <a href="#">이용약관</a> | <a href="#">개인정보처리방침</a> | <a href="#">사업자정보확인</a> | <a href="#">고객센터</a>
                </div>
                <p className="footer-disclaimer">
                    본 사이트는 중고 물품 중개 플랫폼으로서 거래 당사자가 아니며, 거래에 대한 책임은 판매자와 구매자에게 있습니다.
                </p>
            </div>
        </footer>
    );
}

export default Footer;