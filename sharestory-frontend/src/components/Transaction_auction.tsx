import {useEffect, useRef, useState} from "react";
import styles from '../css/Transaction.module.css';
import KakaoMap from '../components/KakoMap';
import type {DealInfo} from '../types/dealInfo';

type TransactionProps = {
    onLocationSelect: (coords: { lat: number; lng: number }) => void;
    onDealInfoChange: (info: DealInfo) => void;
    initialDealInfo?: DealInfo;
};

function Transaction_auction({ onLocationSelect, onDealInfoChange, initialDealInfo }: TransactionProps) {
    console.log("Transaction_item 컴포넌트 렌더링 중...");

    const [transactionMethods, setTransactionMethods] = useState({
        parcel: initialDealInfo?.parcel ?? false,
        direct: initialDealInfo?.direct ?? false,
        auction: initialDealInfo?.auction ?? false,
        safeTrade: initialDealInfo?.safeTrade ?? false,
    });
    const [shippingOption, setShippingOption] = useState(initialDealInfo?.shippingOption || "");
    const [phoneNumber, setPhoneNumber] = useState(initialDealInfo?.phoneNumber || "");
    const [phoneNumberValid, setPhoneNumberValid] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const parcelRef = useRef<HTMLDivElement | null>(null);

    const isValidPhoneNumber = (number: string) => /^010-?\d{4}-?\d{4}$/.test(number);

    // ✅ 초기값 반영 (initialized 제거)
    useEffect(() => {
        if (initialDealInfo) {
            setTransactionMethods((prev) => {
                const next = {
                    parcel: !!initialDealInfo.parcel,
                    direct: !!initialDealInfo.direct,
                    auction: !!initialDealInfo.auction,
                    safeTrade: !!initialDealInfo.safeTrade,
                };
                return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
            });

            setShippingOption((prev) =>
                prev === (initialDealInfo.shippingOption || "") ? prev : initialDealInfo.shippingOption || ""
            );

            setPhoneNumber((prev) =>
                prev === (initialDealInfo.phoneNumber || "") ? prev : initialDealInfo.phoneNumber || ""
            );

            setPhoneNumberValid(
                initialDealInfo.phoneNumber ? isValidPhoneNumber(initialDealInfo.phoneNumber) : false
            );
        }
    }, [initialDealInfo]);

    // ✅ 상위로 전달
    useEffect(() => {
        onDealInfoChange({
            parcel: transactionMethods.parcel,
            direct: transactionMethods.direct,
            auction: transactionMethods.auction,
            safeTrade: transactionMethods.safeTrade,
            shippingOption: transactionMethods.parcel ? shippingOption : '',
            phoneNumber: transactionMethods.parcel ? phoneNumber.replace(/-/g, '') : ''
        });
    }, [transactionMethods, shippingOption, phoneNumber]);

    const handleTransactionMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;

        setTransactionMethods(prev => {
            // ✅ auction을 선택하면 다른 모든 옵션 해제
            if (name === "auction" && checked) {
                return {
                    parcel: false,
                    direct: false,
                    safeTrade: false,
                    auction: true
                };
            }

            // ✅ 다른 옵션을 선택하면 auction 해제
            if (name !== "auction" && checked) {
                return {
                    ...prev,
                    [name]: true,
                    auction: false
                };
            }

            // ✅ 일반적인 체크박스 해제 동작
            return {
                ...prev,
                [name]: checked
            };
        });
    };


    const handleLocationClick = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    useEffect(() => {
        if (parcelRef.current) {
            parcelRef.current.style.maxHeight = transactionMethods.parcel
                ? parcelRef.current.scrollHeight + "px"
                : "0px";
        }
    }, [transactionMethods.parcel]);

    return (
        <div>
            <div className={styles.transactionContainer}>
                <div className={styles.radiostyle}>
                    <label>
                        <input
                            type="checkbox"
                            name="parcel"
                            checked={transactionMethods.parcel}
                            onChange={handleTransactionMethodChange}
                        />
                        <span>택배거래</span>
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            name="direct"
                            checked={transactionMethods.direct}
                            onChange={handleTransactionMethodChange}
                        />
                        <span>직거래</span>
                    </label>
                    {transactionMethods.parcel && (
                        <label>
                            <input
                                type="checkbox"
                                name="safeTrade"
                                checked={transactionMethods.safeTrade}
                                onChange={handleTransactionMethodChange}
                            />
                            <span>🔒 안전거래</span>
                        </label>
                    )}
                </div>

                <div className={styles.expandable} ref={parcelRef}>
                    <div className={styles.shippingOption}>
                        <span className={styles.title}>배송비 선택</span>
                        <label>
                            <input
                                type="radio"
                                name="shippingOption"
                                value="included"
                                checked={shippingOption === "included"}
                                onChange={(e) => setShippingOption(e.target.value)}
                            />
                            <span>배송비 포함</span>
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="shippingOption"
                                value="separate"
                                checked={shippingOption === "separate"}
                                onChange={(e) => setShippingOption(e.target.value)}
                            />
                            <span>배송비 별도</span>
                        </label>
                    </div>

                    {transactionMethods.parcel && (
                        <div className={styles.phoneInput}>
                            <label>연락처 (택배 발송용)</label>
                            <input
                                type="tel"
                                placeholder="01012345678"
                                value={phoneNumber}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setPhoneNumber(value);
                                    setPhoneNumberValid(isValidPhoneNumber(value));
                                }}
                            />
                            {/* ✅ 입력값이 있는데 정규식에 맞지 않으면 메시지 출력 */}
                            {!phoneNumberValid && phoneNumber.length > 0 && (
                                <p className={styles.validationMessage}>
                                    올바른 휴대폰 번호를 입력해주세요. (예: 01012345678)
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <hr className={styles.hr} />
                <h4>위치등록</h4>
                <div className={styles.locationOption}>
                    <button type="button" className={styles.locationOptionButton} onClick={handleLocationClick}>
                        지도열기
                    </button>
                </div>

                {isModalOpen && (
                    <div>
                        <div className={styles.modal}>
                            <div className={styles.modalContent}>
                                <div className={styles.mapOverlay}>
                                    이웃과 만나서 거래하고 싶은 장소를 선택해주세요.<br />
                                    누구나 쉽게 찾을 수 있는 공공장소가 좋아요.
                                </div>

                                <KakaoMap
                                    onSelect={({ lat, lng }) => {
                                        onLocationSelect({ lat, lng });
                                    }}
                                />

                                <button onClick={handleCloseModal}>지정하기</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Transaction_auction;