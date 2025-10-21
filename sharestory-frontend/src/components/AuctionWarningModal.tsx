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
                    <li>2️⃣ 입찰이 1건이라도 발생하면 <b>경매 취소가 불가능</b>합니다.</li>
                    <li>3️⃣ 낙찰 후 <b>3일 이내 결제</b>를 완료해야 하며, 미결제 시 <b>입찰 금액의 20%</b>가 패널티로 차감됩니다.</li>
                    <li>4️⃣ 허위 또는 과장된 정보를 등록할 경우 <b>이용 제한</b> 조치가 취해질 수 있습니다.</li>
                    <li>5️⃣ 낙찰 후 정당한 사유 없이 판매를 거부할 경우 <b>계정 제재 및 포인트 차감</b>이 발생합니다.</li>
                    <li>6️⃣ 낙찰된 상품은 반드시 <b>3일 이내 발송</b>해야 합니다.</li>
                    <li>7️⃣ 입찰 후 다른 사용자가 더 높은 금액을 입찰하면, <b>자동으로 포인트가 환불</b>됩니다.</li>
                    <li>8️⃣ <b>자신의 다른 계정으로 입찰하거나 담합 행위</b>를 할 경우, 즉시 이용이 제한됩니다.</li>
                    <li>9️⃣ 상품 하자 또는 미발송 등 분쟁 발생 시, <b>판매자에게 책임이 부과</b>됩니다.</li>
                    <li>🔟 낙찰 후 정당한 사유 없이 거래를 취소할 경우, <b>판매자와 구매자 모두 제재 대상</b>이 됩니다.</li>
                </ul>

                <p className={styles["auction-warning-notice"]}>
                    위 사항에 모두 동의하시면 ‘등록하기’를 눌러주세요.
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
