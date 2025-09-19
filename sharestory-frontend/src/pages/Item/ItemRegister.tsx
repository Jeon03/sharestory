import {useEffect, useRef, useState} from 'react';
import styles from '../../css/SalesPage.module.css';
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

const ItemRegister = () => {
    const [form, setForm] = useState<FormState>({ latitude: 0, longitude: 0 });
    const [dealInfo, setDealInfo] = useState<DealInfo>({
        parcel: false,
        direct: false,
        auction: false,
        shippingOption: '',
    });

    // 1) 단일 → 다중 파일 상태
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    const [selectedCondition, setSelectedCondition] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [productName, setProductName] = useState('');
    const [price, setPrice] = useState('');
    const [productExplain, setProductExplain] = useState('');
    const [showAgreeModal, setShowAgreeModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const navigate = useNavigate();

    const hasValidDealMethod = Boolean(dealInfo.parcel || dealInfo.direct || dealInfo.auction);
    const hasValidShippingOption = !dealInfo.parcel || !!dealInfo.shippingOption;

    // 이미지가 최소 1장 있어야 등록 가능
    const isFormValid = Boolean(
        productName &&
        selectedCategory &&
        images.length > 0 &&
        selectedCondition &&
        price &&
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

    // 2) 파일 선택(여러 장) + 필터링 + 최대 3장 제한
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? []);

        // 포맷 필터링
        const valid = selected.filter(f => ACCEPTED.includes(f.type));
        if (valid.length !== selected.length) {
            alert('이미지 파일(jpeg/png/webp/gif)만 업로드할 수 있어요.');
        }

        // 중복 제거(이름+크기)
        const merged = [...images, ...valid].filter(
            (f, idx, arr) => arr.findIndex(x => x.name === f.name && x.size === f.size) === idx
        );

        // 최대 3장으로 자르기
        const limited = merged.slice(0, MAX_IMAGES);
        if (merged.length > MAX_IMAGES) {
            alert(`이미지는 최대 ${MAX_IMAGES}장까지 업로드할 수 있어요.`);
        }

        setImages(limited);

        // 같은 파일 다시 선택 가능하도록 초기화
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // 3) 미리보기 URL 갱신 및 정리
    useEffect(() => {
        const urls = images.map(f => URL.createObjectURL(f));
        setPreviews(urls);
        return () => urls.forEach(u => URL.revokeObjectURL(u));
    }, [images]);

    // 🗑️ 썸네일 삭제
    const removeAt = (idx: number) => {
        const next = [...images];
        next.splice(idx, 1);
        setImages(next);
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (!value) {
            setPrice('');
            return;
        }
        const formattedValue = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        setPrice(formattedValue);
    };

    const handleSubmit = async () => {
        if (dealInfo.parcel) {
            const phone = dealInfo.phoneNumber || '';
            const isValidPhone = /^010-?\d{4}-?\d{4}$/.test(phone);
            if (!isValidPhone) {
                alert('택배 거래를 선택한 경우 올바른 전화번호를 입력해야 합니다.\n예: 010-1234-5678');
                return;
            }
        }

        const formData = new FormData();
        formData.append('title', productName);
        formData.append('category', selectedCategory);

        images.forEach(file => formData.append('images', file));

        formData.append('condition', selectedCondition);
        formData.append('price', price.replace(/,/g, ''));
        formData.append('description', productExplain);
        formData.append('dealInfo', JSON.stringify(dealInfo));
        formData.append('latitude', String(form.latitude));
        formData.append('longitude', String(form.longitude));

        const API_BASE = import.meta.env.VITE_API_BASE || '';

        try {
            const res = await fetch(`${API_BASE}/api/registerItem`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (res.ok) {
                await res.json();
                alert('물품이 등록되었습니다.');
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
            <h2 className={styles.h2_top}>상품정보</h2>
            <hr className={styles.hr_bold} />

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    setShowAgreeModal(true);
                }}
                encType="multipart/form-data"
            >
                {/* 이미지 업로드 */}
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

                        {/* 미리보기 타일 */}
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

                        {/* (선택) 빈 슬롯: 총 3칸 유지하되, 업로드 버튼과 미리보기 제외한 나머지만 표시 */}
                        {Array.from({
                            length: Math.max(0, MAX_IMAGES - (images.length + (images.length < MAX_IMAGES ? 1 : 0))),
                        }).map((_, i) => (
                            <div key={`empty-${i}`} className={styles.emptySlot} />
                        ))}
                    </div>

                    <p className={styles.helperText}>jpeg/png/webp/gif, 최대 {MAX_IMAGES}장 업로드</p>
                </div>

                {/* 상품명 */}
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

                {/* 카테고리 */}
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

                {/* 상품 상태 */}
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

                {/* 설명 */}
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

                {/* 가격 */}
                <h2 className={styles.h2}>가격</h2>
                <hr className={styles.hr_bold} />
                <div className={styles.price}>
                    <h4>판매가격</h4>
                    <div className={styles.priceInputWrapper}>
                        <input
                            type="text"
                            placeholder="가격을 입력해주세요."
                            value={price}
                            maxLength={12}
                            onChange={handlePriceChange}
                        />
                        <span className={styles.won}>원</span>
                    </div>
                </div>

                {/* 거래 방식 + 위치 */}
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
                    <button type="submit" className={styles.submitOptionButton} disabled={!isFormValid}>
                        등록하기
                    </button>
                </div>
            </form>

            {/* 위치 동의 모달 */}
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

export default ItemRegister;