import {useEffect, useRef, useState} from 'react';
import styles from '../../css/SalesPage.module.css'; // 기존 CSS Module 재사용
import AgreeModal from '../../components/AgreeModal';
import Category from '../../components/Category';
import Transaction from "../../components/Transaction";
import {useNavigate} from 'react-router-dom';
import type {DealInfo} from '../../types/dealInfo';

type FormState = {
    latitude: number;
    longitude: number;
    dealInfo?: string;
};

const MAX_IMAGES = 3;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const AUCTION_DURATIONS = [1, 3, 5, 7]; // 경매 기간 옵션 (단위: 일)

const AuctionRegister = () => {
    const [form, setForm] = useState<FormState>({ latitude: 0, longitude: 0 });
    const [dealInfo, setDealInfo] = useState<DealInfo>({
        parcel: false,
        direct: false,
        shippingOption: '',
    });

    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    const [selectedCondition, setSelectedCondition] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [productName, setProductName] = useState('');

    // --- 옥션 관련 상태 추가 ---
    const [startPrice, setStartPrice] = useState(''); // 경매 시작가
    const [buyNowPrice, setBuyNowPrice] = useState(''); // 즉시 구매가 (선택)
    const [auctionDuration, setAuctionDuration] = useState<number | null>(null); // 경매 기간

    const [productExplain, setProductExplain] = useState('');
    const [showAgreeModal, setShowAgreeModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const navigate = useNavigate();

    const hasValidDealMethod = Boolean(dealInfo.parcel || dealInfo.direct);
    const hasValidShippingOption = !dealInfo.parcel || !!dealInfo.shippingOption;

    // --- 폼 유효성 검사 수정 ---
    const isFormValid = Boolean(
        productName &&
        selectedCategory &&
        images.length > 0 &&
        selectedCondition &&
        startPrice && // 'price' 대신 'startPrice' 검사
        auctionDuration && // 경매 기간 선택 여부 검사
        productExplain &&
        form.latitude &&
        form.longitude &&
        hasValidDealMethod &&
        hasValidShippingOption
    );

    const handleDealInfoChange = (info: DealInfo) => {
        setDealInfo(info);
        setForm(prev => ({ ...prev, dealInfo: JSON.stringify(info) }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? []);
        const valid = selected.filter(f => ACCEPTED.includes(f.type));
        if (valid.length !== selected.length) {
            alert('이미지 파일(jpeg/png/webp/gif)만 업로드할 수 있어요.');
        }

        const merged = [...images, ...valid].filter(
            (f, idx, arr) => arr.findIndex(x => x.name === f.name && x.size === f.size) === idx
        );

        const limited = merged.slice(0, MAX_IMAGES);
        if (merged.length > MAX_IMAGES) {
            alert(`이미지는 최대 ${MAX_IMAGES}장까지 업로드할 수 있어요.`);
        }

        setImages(limited);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    useEffect(() => {
        const urls = images.map(f => URL.createObjectURL(f));
        setPreviews(urls);
        return () => urls.forEach(u => URL.revokeObjectURL(u));
    }, [images]);

    const removeAt = (idx: number) => {
        const next = [...images];
        next.splice(idx, 1);
        setImages(next);
    };

    // --- 가격 포맷팅 핸들러 (재사용) ---
    const formatPrice = (value: string) => {
        const digitsOnly = value.replace(/\D/g, '');
        if (!digitsOnly) return '';
        return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const handleStartPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStartPrice(formatPrice(e.target.value));
    };

    const handleBuyNowPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBuyNowPrice(formatPrice(e.target.value));
    };


    // --- 폼 제출 핸들러 수정 ---
    // --- 폼 제출 핸들러 수정 ---
    const handleSubmit = async () => {
        // (기존 유효성 검사 코드는 그대로 둡니다)
        if (dealInfo.parcel) {
            // ...
        }
        const startPriceNum = Number(startPrice.replace(/,/g, ''));
        const buyNowPriceNum = Number(buyNowPrice.replace(/,/g, ''));
        if (buyNowPrice && buyNowPriceNum <= startPriceNum) {
            alert('즉시 구매가는 경매 시작가보다 높아야 합니다.');
            return;
        }

        // --- 👇 여기부터 수정 ---

        // 1. 백엔드가 요구하는 'data' JSON 객체 생성
        const data = {
            title: productName,
            category: selectedCategory,
            condition: selectedCondition,
            description: productExplain,
            dealInfo: dealInfo, // dealInfo는 이미 객체이므로 JSON.stringify 불필요
            latitude: form.latitude,
            longitude: form.longitude,
            minPrice: startPrice.replace(/,/g, ''),
            buyNowPrice: buyNowPrice ? buyNowPrice.replace(/,/g, '') : null,
            auctionDuration: auctionDuration,
        };

        const formData = new FormData();

        // 2. 'data' 객체는 JSON 문자열로 변환하여 추가
        formData.append('data', new Blob([JSON.stringify(data)], { type: "application/json" }));

        // 'images'는 파일 그대로 추가
        images.forEach(file => formData.append('images', file));

        // 3. API 엔드포인트를 백엔드 컨트롤러 주소와 일치시킴
        const API_BASE = import.meta.env.VITE_API_BASE || '';
        const API_ENDPOINT = `${API_BASE}/api/auction-items`; // '/api/registerAuction' -> '/api/auction-items'

        try {
            const res = await fetch(API_ENDPOINT, {
                method: 'POST',
                credentials: 'include',
                body: formData
                // 주의: multipart/form-data 요청 시 Content-Type 헤더는 브라우저가 자동으로 설정하므로 직접 명시하지 마세요.
            });

            if (res.ok) {
                await res.json();
                alert('경매 상품이 등록되었습니다.');
                navigate('/');
            } else {
                const msg = await res.text().catch(() => '');
                alert('등록 실패' + (msg ? `: ${msg}` : ''));
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                alert('오류 발생: ' + err.message);
            } else {
                alert('알 수 없는 오류 발생');
            }
        }
    };

    return (
        <section className={styles.saleProduct}>
            {/* 제목 변경 */}
            <h2 className={styles.h2_top}>경매 상품 정보</h2>
            <hr className={styles.hr_bold} />

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    setShowAgreeModal(true);
                }}
                encType="multipart/form-data"
            >
                {/* 이미지 업로드 (기존과 동일) */}
                <div className={styles.productImage}>
                    <h4>상품이미지</h4>
                    <div className={styles.previewGrid}>
                        {images.length < MAX_IMAGES && (
                            <>
                                <input
                                    id="image-input"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="image-input" className={styles.uploadTile}>
                                    <span>이미지등록<br />+</span>
                                </label>
                            </>
                        )}
                        {previews.map((src, i) => (
                            <div key={i} className={styles.previewItem}>
                                <img src={src} alt={`미리보기-${i}`} className={styles.userimg} />
                                <button
                                    type="button"
                                    className={styles.removeBtn}
                                    onClick={() => removeAt(i)}
                                    aria-label={`이미지 ${i + 1} 삭제`}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        {Array.from({
                            length: Math.max(0, MAX_IMAGES - (images.length + (images.length < MAX_IMAGES ? 1 : 0))),
                        }).map((_, i) => (
                            <div key={`empty-${i}`} className={styles.emptySlot} />
                        ))}
                    </div>
                    <p className={styles.helperText}>jpeg/png/webp/gif, 최대 {MAX_IMAGES}장 업로드</p>
                </div>

                {/* 상품명 (기존과 동일) */}
                <hr className={styles.hr} />
                <div className={styles.productName}>
                    <h4>상품명</h4>
                    <input
                        maxLength={50}
                        placeholder="상품명을 입력해 주세요."
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                    />
                    <p className={styles.characterCount}>{productName.length}/50</p>
                </div>

                {/* 카테고리 (기존과 동일) */}
                <hr className={styles.hr} />
                <div className={styles.category}>
                    <h4>카테고리</h4>
                    <div className={styles.categoryContainer}>
                        <Category
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                            enableNavigation={false}
                        />
                    </div>
                </div>

                {/* 상품 상태 (기존과 동일) */}
                <hr className={styles.hr} />
                <div className={styles.productCondition}>
                    <h4>상품상태</h4>
                    {['중고상품', '새상품(미사용)', '고장·파손상품'].map((condition) => (
                        <button
                            key={condition}
                            type="button"
                            className={selectedCondition === condition ? styles.selected : ''}
                            onClick={() => setSelectedCondition(condition)}
                        >
                            {condition}
                        </button>
                    ))}
                </div>

                {/* 설명 (기존과 동일) */}
                <hr className={styles.hr} />
                <div className={styles.productExplain}>
                    <h4>상품설명</h4>
                    <textarea
                        maxLength={2000}
                        placeholder="브랜드, 모델명, 구매 시기, 하자 유무 등"
                        value={productExplain}
                        onChange={(e) => setProductExplain(e.target.value)}
                    />
                    <p>{productExplain.length}/2000</p>
                </div>

                {/* --- 가격 섹션 → 경매 정보 섹션으로 변경 --- */}
                <h2 className={styles.h2}>경매 정보</h2>
                <hr className={styles.hr_bold} />

                {/* 경매 시작가 */}
                <div className={styles.price}>
                    <h4>경매 시작가</h4>
                    <div className={styles.priceInputWrapper}>
                        <input
                            type="text"
                            placeholder="경매 시작 가격을 입력해주세요."
                            value={startPrice}
                            maxLength={12}
                            onChange={handleStartPriceChange}
                        />
                        <span className={styles.won}>원</span>
                    </div>
                </div>

                <hr className={styles.hr} />

                {/* 즉시 구매가 (선택) */}
                <div className={styles.price}>
                    <h4>즉시 구매가 (선택)</h4>
                    <div className={styles.priceInputWrapper}>
                        <input
                            type="text"
                            placeholder="즉시 구매 가격을 입력해주세요."
                            value={buyNowPrice}
                            maxLength={12}
                            onChange={handleBuyNowPriceChange}
                        />
                        <span className={styles.won}>원</span>
                    </div>
                </div>

                <hr className={styles.hr} />

                {/* 경매 기간 */}
                <div className={styles.productCondition}>
                    <h4>경매 기간</h4>
                    {AUCTION_DURATIONS.map((day) => (
                        <button
                            key={`${day}일`}
                            type="button"
                            className={auctionDuration === day ? styles.selected : ''}
                            onClick={() => setAuctionDuration(day)}
                        >
                            {day}일
                        </button>
                    ))}
                </div>


                {/* 거래 방식 + 위치 (기존과 동일) */}
                <h2 className={styles.h2}>거래</h2>
                <hr className={styles.hr_bold} />
                <h4>거래방법</h4>
                <div className={styles.exchangeMethod}>
                    <div className={styles.transactionStyle}>
                        <Transaction
                            onLocationSelect={({ lat, lng }) =>
                                setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))
                            }
                            onDealInfoChange={handleDealInfoChange}
                        />
                    </div>
                </div>

                {/* 등록 버튼 */}
                <hr className={styles.hr_bold} />
                <div className={styles.submitOption}>
                    {/* 버튼 텍스트 변경 */}
                    <button type="submit" className={styles.submitOptionButton} disabled={!isFormValid}>
                        경매 등록하기
                    </button>
                </div>
            </form>

            {/* 위치 동의 모달 (기존과 동일) */}
            {showAgreeModal && (
                <AgreeModal
                    onAgree={() => {
                        setShowAgreeModal(false);
                        handleSubmit();
                    }}
                    onCancel={() => setShowAgreeModal(false)}
                />
            )}
        </section>
    );
};

export default AuctionRegister;