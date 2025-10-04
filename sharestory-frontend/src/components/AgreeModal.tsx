import {useState} from 'react';
import styles from '../css/ProjectRegisterForm.module.css';

type AgreeFormProps = {
    onAgree: () => void;
    onCancel: () => void;
};

function Agreeform({ onAgree, onCancel }: AgreeFormProps) {
    const [locationAgreement, setLocationAgreement] = useState(false);

    const handleConfirm = () => {
        if (!locationAgreement) {
            alert('위치정보 수집 및 이용에 동의해야 위치를 선택할 수 있습니다.');
            return;
        }
        onAgree();
    };

    return (
        <div className={styles.modalBackground}>
            <div className={styles.modalContent}>
                <h2 className={styles.modalHeader}>위치정보 수집 및 이용 동의</h2>
                <div className={styles.modalBody}>
                    <p><strong>1. 수집 목적:</strong> 위치 기반 중고거래 서비스 제공</p><br />
                    <p><strong>2. 수집 항목:</strong> GPS, Wi-Fi, IP, 직접 입력한 위치</p><br />
                    <p><strong>3. 보유 기간:</strong> 서비스 이용 기간 동안 보유, 목적 달성 시 파기</p><br />
                    <p><strong>4. 제공 및 공유:</strong> 법령에 의한 경우 외에는 제3자 제공 없음</p><br />
                    <p><strong>5. 거부 시:</strong> 위치 기반 서비스 이용 제한 가능</p>
                </div>

                <label className={styles.checkboxContainer}>
                    <input
                        type="checkbox"
                        checked={locationAgreement}
                        onChange={(e) => setLocationAgreement(e.target.checked)}
                        className={styles.checkboxInput}
                    />
                    위치정보 수집 및 이용에 동의합니다.
                </label>

                <div className={styles.buttonGroup}>
                    <button onClick={onCancel} className={styles.buttonCancel}>취소</button>
                    <button onClick={handleConfirm} className={styles.buttonConfirm}>
                        동의
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Agreeform;
