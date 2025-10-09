import styles from "../css/AuctionWarningModal.module.css";

interface AuctionWarningModalProps {
    onAgree: () => void;
    onCancel: () => void;
}

export default function AuctionWarningModal({ onAgree, onCancel }: AuctionWarningModalProps) {
    return (
        <div className={styles["auction-warning-overlay"]}>
            <div className={styles["auction-warning-modal"]}>
                <h2 className={styles["auction-warning-title"]}>⚠️ 경매 등록 전 반드시 확인해주세요</h2>

                <ul className={styles["auction-warning-list"]}>
                    <li>1️⃣ 상품 등록 후에는 <b>수정이 불가능</b>합니다.</li>
                    <li>2️⃣ 경매 도중 상품 삭제 시 <b>등록 금액의 10%</b>가 차감됩니다.</li>
                    <li>3️⃣ 입찰이 1건이라도 발생하면 <b>경매 취소가 불가능</b>합니다.</li>
                    <li>4️⃣ 허위·과장된 정보 등록 시 <b>이용 제한</b> 조치가 취해질 수 있습니다.</li>
                    <li>5️⃣ 낙찰 후 정당한 사유 없는 미판매 시 <b>계정 제재 및 포인트 차감</b>이 발생합니다.</li>
                    <li>6️⃣ 낙찰된 상품은 <b>3일 이내 발송</b>해야 합니다.</li>
                </ul>

                <p className={styles["auction-warning-notice"]}>
                    ✅ 위 사항에 모두 동의하시면 ‘등록하기’를 눌러주세요.
                </p>

                <div className={styles["auction-warning-buttons"]}>
                    <button onClick={onCancel} className={styles["auction-warning-cancel-btn"]}>
                        취소
                    </button>
                    <button onClick={onAgree} className={styles["auction-warning-agree-btn"]}>
                        등록하기
                    </button>
                </div>
            </div>
        </div>
    );
}
