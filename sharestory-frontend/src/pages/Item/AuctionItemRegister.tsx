import { useEffect, useRef, useState } from 'react';
import styles from '../../css/AuctionSalesPage.module.css';
import AgreeModal from '../../components/AgreeModal';
import Category from '../../components/Category';
import { useNavigate } from 'react-router-dom';
import type { DealInfo } from '../../types/dealInfo';

type FormState = {
    latitude?: number;
    longitude?: number;
};

const MAX_IMAGES = 3;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const AuctionItemRegister = () => {
    const [form, setForm] = useState<FormState>({});

    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [selectedCondition, setSelectedCondition] = useState('중고상품');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [productName, setProductName] = useState('');
    const [productExplain, setProductExplain] = useState('');
    const [showAgreeModal, setShowAgreeModal] = useState(false);

    // 경매 관련 상태
    const [price, setPrice] = useState('');           // 경매 시작가
    const [bidUnit, setBidUnit] = useState('');       // 입찰 단위
    const [isImmediatePurchase, setIsImmediatePurchase] = useState<'yes' | 'no'>('no');
    const [immediatePrice, setImmediatePrice] = useState(''); // 즉시구매 가격
    const [endDateTime, setEndDateTime] = useState('');

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const navigate = useNavigate();

    // 등록 버튼 활성화 조건 (경매 관련 필드만)
    const isFormValid = Boolean(
        productName &&
        selectedCategory &&
        images.length > 0 &&
        selectedCondition &&
        price &&
        bidUnit &&
        productExplain &&
        endDateTime &&
        (isImmediatePurchase === 'no' || (isImmediatePurchase === 'yes' && immediatePrice))
    );

    // 이미지 업로드 처리
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? []);
        const valid = selected.filter(f => ACCEPTED.includes(f.type));
        if (valid.length !== selected.length) alert('이미지 파일(jpeg/png/webp/gif)만 업로드할 수 있어요.');

        const merged = [...images, ...valid].filter(
            (f, idx, arr) => arr.findIndex(x => x.name === f.name && x.size === f.size) === idx
        );

        const limited = merged.slice(0, MAX_IMAGES);
        if (merged.length > MAX_IMAGES) alert(`이미지는 최대 ${MAX_IMAGES}장까지 업로드할 수 있어요.`);

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

    const handlePriceChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setter(value ? value.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '');
    };

    const handleSubmit = async () => {
        const formData = new FormData();
        formData.append('title', productName);
        formData.append('category', selectedCategory);
        images.forEach(file => formData.append('images', file));
        formData.append('condition', selectedCondition);
        formData.append('price', price.replace(/,/g, ''));
        formData.append('bidUnit', bidUnit.replace(/,/g, ''));
        formData.append('description', productExplain);
        formData.append('isImmediatePurchase', isImmediatePurchase);
        if (isImmediatePurchase === 'yes') formData.append('immediatePrice', immediatePrice.replace(/,/g, ''));
        formData.append('endDateTime', endDateTime);

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
            if (err instanceof Error) alert('오류 발생: ' + err.message);
            else alert('알 수 없는 오류 발생');
        }
    };

    const now = new Date();
    const maxDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const formatDate = (d: Date) => d.toISOString().slice(0, 16);

    return (
        <section className={styles.saleProduct}>
            <h2 className={styles.h2_top}>상품정보</h2>
            <hr className={styles.hr_bold} />

            <form
                onSubmit={(e) => { e.preventDefault(); setShowAgreeModal(true); }}
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
                        {previews.map((src, i) => (
                            <div key={i} className={styles.previewItem}>
                                <img src={src} alt={`미리보기-${i}`} className={styles.userimg} />
                                <button type="button" className={styles.removeBtn} onClick={() => removeAt(i)}>✕</button>
                            </div>
                        ))}
                        {Array.from({
                            length: Math.max(0, MAX_IMAGES - (images.length + (images.length < MAX_IMAGES ? 1 : 0))),
                        }).map((_, i) => <div key={`empty-${i}`} className={styles.emptySlot} />)}
                    </div>
                    <p className={styles.helperText}>jpeg/png/webp/gif, 최대 {MAX_IMAGES}장 업로드</p>
                </div>

                {/* 상품명 */}
                <hr className={styles.hr} />
                <div className={styles.productName}>
                    <h4>상품명</h4>
                    <input maxLength={50} placeholder="상품명을 입력해 주세요." value={productName} onChange={(e) => setProductName(e.target.value)} />
                    <p className={styles.characterCount}>{productName.length}/50</p>
                </div>

                {/* 카테고리 */}
                <hr className={styles.hr} />
                <div className={styles.category}>
                    <h4>카테고리</h4>
                    <div className={styles.categoryContainer}>
                        <Category selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} enableNavigation={false} />
                    </div>
                </div>

                {/* 상품 상태 */}
                <hr className={styles.hr} />
                <div className={styles.productCondition}>
                    <h4>상품상태</h4>
                    {['중고상품', '새상품(미사용)', '고장·파손상품'].map((condition) => (
                        <button key={condition} type="button" className={selectedCondition === condition ? styles.selected : ''} onClick={() => setSelectedCondition(condition)}>
                            {condition}
                        </button>
                    ))}
                </div>

                {/* 설명 */}
                <hr className={styles.hr} />
                <div className={styles.productExplain}>
                    <h4>상품설명</h4>
                    <textarea maxLength={2000} placeholder="브랜드, 모델명, 구매 시기, 하자 유무 등" value={productExplain} onChange={(e) => setProductExplain(e.target.value)} />
                    <p>{productExplain.length}/2000</p>
                </div>

                {/* 경매 */}
                <h2 className={styles.h2}>경매</h2>
                <hr className={styles.hr_bold} />

                {/* 경매 시작가 */}
                <div className={styles.price}>
                    <h4>경매시작가</h4>
                    <div className={styles.priceInputWrapper}>
                        <input type="text" placeholder="가격을 입력해주세요." value={price} maxLength={12} onChange={handlePriceChange(setPrice)} />
                        <span className={styles.won}>원</span>
                    </div>
                </div>

                <hr className={styles.hr}/>
                <div className={styles.immediatePurchase}>
                    <h4>즉시구매여부</h4>
                    <div className={styles.immediatePurchaseRadio}>
                        <label>
                            <input
                                type="radio"
                                name="immediatePurchase"
                                value="yes"
                                checked={isImmediatePurchase === 'yes'}
                                onChange={() => setIsImmediatePurchase('yes')}
                            />
                            예
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="immediatePurchase"
                                value="no"
                                checked={isImmediatePurchase === 'no'}
                                onChange={() => setIsImmediatePurchase('no')}
                            />
                            아니오
                        </label>
                    </div>

                    <div className={`${styles.immediatePriceWrapper} ${isImmediatePurchase === 'yes' ? styles.active : ''}`}>
                        <div className={styles.immediatePrice}>
                            <input
                                type="number"
                                placeholder="즉시구매가 입력"
                                value={immediatePrice}
                                onChange={(e) => setImmediatePrice(e.target.value)}
                            />
                            <span>원</span>
                        </div>
                    </div>
                </div>



                {/* 입찰 단위 */}
                <hr className={styles.hr} />
                <div className={styles.bidUnit}>
                    <h4>입찰단위</h4>
                    <div className={styles.bidUnitInputWrapper}>
                        <input type="text" placeholder="단위를 입력해주세요." value={bidUnit} maxLength={12} onChange={handlePriceChange(setBidUnit)} />
                        <span className={styles.bidUnitwon}>원</span>
                    </div>
                </div>

                {/* 경매 종료일시 */}
                <hr className={styles.hr} />
                <div className={styles.endDateTime}>
                    <h4>경매종료일시</h4>
                    <input type="datetime-local" value={endDateTime} onChange={(e) => setEndDateTime(e.target.value)} min={formatDate(now)} max={formatDate(maxDate)} />
                    <p className={styles.helperText}>최대 1주일 이내로 설정할 수 있습니다.</p>
                </div>

                {/* 등록 버튼 */}
                <hr className={styles.hr_bold} />
                <div className={styles.submitOption}>
                    <button type="submit" className={styles.submitOptionButton} disabled={!isFormValid}>등록하기</button>
                </div>
            </form>

            {showAgreeModal && (
                <AgreeModal
                    onAgree={() => { setShowAgreeModal(false); handleSubmit(); }}
                    onCancel={() => setShowAgreeModal(false)}
                />
            )}
        </section>
    );
};

export default AuctionItemRegister;
