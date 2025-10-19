import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "../../css/SalesPage.module.css";
import AgreeModal from "../../components/AgreeModal";
import Category from "../../components/Category";
import Transaction from "../../components/Transaction";
import type { DealInfo } from "../../types/dealInfo";

type FormState = {
    latitude: number;
    longitude: number;
    dealInfo?: string;
};
//test
type ExistingImage = { id: number; url: string };

const MAX_IMAGES = 3;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function ItemEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState<FormState>({ latitude: 0, longitude: 0 });
    const [dealInfo, setDealInfo] = useState<DealInfo>({
        parcel: false,
        direct: false,
        safeTrade: false,
        shippingOption: "",
        phoneNumber: "",
    });

    // 이미지 관리
    const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
    const [newImages, setNewImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);

    // 상품 필드
    const [productName, setProductName] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedCondition, setSelectedCondition] = useState("");
    const [price, setPrice] = useState("");
    const [productExplain, setProductExplain] = useState("");
    const [showAgreeModal, setShowAgreeModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // ✅ 수정 모드: 기존 데이터 불러오기
    useEffect(() => {
        if (id) {
            fetch(`${API_BASE}/api/items/${id}`, { credentials: "include" })
                .then((res) => res.json())
                .then((data) => {
                    setProductName(data.title);
                    setSelectedCategory(data.category);
                    setSelectedCondition(data.condition);
                    setPrice(String(data.price));
                    setProductExplain(data.description);

                    setDealInfo({
                        ...data.dealInfo,
                        phoneNumber: "",
                    });

                    setForm({
                        latitude: data.latitude,
                        longitude: data.longitude,
                        dealInfo: JSON.stringify(data.dealInfo),
                    });

                    if (data.images) {
                        setExistingImages(data.images); // 이제 {id, url} 그대로 들어옴
                    }
                });
        }
    }, [id]);

    // 신규 이미지 프리뷰
    useEffect(() => {
        const urls = newImages.map((f) => URL.createObjectURL(f));
        setPreviews(urls);
        return () => urls.forEach((u) => URL.revokeObjectURL(u));
    }, [newImages]);

    // 파일 선택
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? []);
        const valid = selected.filter((f) => ACCEPTED.includes(f.type));

        if (existingImages.length + newImages.length + valid.length > MAX_IMAGES) {
            alert(`이미지는 최대 ${MAX_IMAGES}장까지 업로드할 수 있어요.`);
            return;
        }
        setNewImages((prev) => [...prev, ...valid]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // 기존 이미지 제거
    const removeExisting = (img: ExistingImage) => {
        setExistingImages((prev) => prev.filter((i) => i.id !== img.id));
        setRemovedImageIds((prev) => [...prev, img.id]); // ✅ DB id가 그대로 전송됨
    };

    // 신규 이미지 제거
    const removeNew = (idx: number) => {
        const next = [...newImages];
        next.splice(idx, 1);
        setNewImages(next);
    };

    // 거래 방식 변경
    const handleDealInfoChange = useCallback((info: DealInfo) => {
        setDealInfo(info);
    }, []);

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "");
        setPrice(value ? value.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "");
    };

    // ✅ 수정 제출
    const handleSubmit = async () => {
        const totalImages = existingImages.length + newImages.length;
        if (totalImages === 0) {
            alert("상품 이미지는 최소 1장 이상 등록해야 합니다.");
            return;
        }

        const dto = {
            title: productName,
            category: selectedCategory,
            condition: selectedCondition,
            price: price.replace(/,/g, ""),
            description: productExplain,
            dealInfo,
            latitude: form.latitude,
            longitude: form.longitude,
        };

        const formData = new FormData();
        formData.append(
            "data",
            new Blob([JSON.stringify(dto)], { type: "application/json" })
        );

        // ✅ 새 이미지 파일만 append
        newImages.forEach((file) => formData.append("images", file));

        // ✅ 삭제된 이미지 ID 전달
        formData.append("deletedImageIds", JSON.stringify(removedImageIds));

        const res = await fetch(`${API_BASE}/api/items/${id}`, {
            method: "PUT",
            credentials: "include",
            body: formData,
        });
        if (res.status === 401) {
            // ✅ 토큰 만료 처리
            alert('로그인이 만료되었습니다. 다시 로그인 후 시도해주세요.');
            return;
        }
        if (res.ok) {
            alert("상품이 수정되었습니다.");
            navigate(`/items/${id}`);
        } else {
            alert("수정 실패");
        }
    };

    return (
        <section className={styles.saleProduct}>
            <h2 className={styles.h2_top}>상품 수정</h2>
            <hr className={styles.hr_bold} />
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    setShowAgreeModal(true);
                }}
                encType="multipart/form-data"
            >
                {/* 이미지 영역 */}
                <div className={styles.previewGrid}>
                    {/* ✅ 기존 이미지 */}
                    {existingImages.map((img) => (
                        <div key={`exist-${img.id}`} className={styles.previewItem}>
                            <img src={img.url} alt="기존 이미지" className={styles.userimg} />
                            <button
                                type="button"
                                className={styles.removeBtn}
                                onClick={() => removeExisting(img)}
                                aria-label="기존 이미지 삭제"
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    {/* ✅ 새로 추가된 이미지 */}
                    {previews.map((src, i) => (
                        <div key={`new-${i}`} className={styles.previewItem}>
                            <img src={src} alt={`새 이미지 ${i}`} className={styles.userimg} />
                            <button
                                type="button"
                                className={styles.removeBtn}
                                onClick={() => removeNew(i)}
                                aria-label="새 이미지 삭제"
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    {/* ✅ 업로드 버튼 */}
                    {existingImages.length + newImages.length < MAX_IMAGES && (
                        <>
                            <input
                                id="image-input"
                                type="file"
                                accept="image/*"
                                multiple
                                ref={fileInputRef}
                                style={{ display: "none" }}
                                onChange={handleFileChange}
                            />
                            <label htmlFor="image-input" className={styles.uploadTile}>
                                <span>이미지추가+</span>
                            </label>
                        </>
                    )}
                </div>

                {/* 상품명 */}
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

                {/* 상태 */}
                <hr className={styles.hr} />
                <div className={styles.productCondition}>
                    <h4>상품상태</h4>
                    {["중고상품", "새상품(미사용)", "고장·파손상품"].map((condition) => (
                        <button
                            key={condition}
                            type="button"
                            className={selectedCondition === condition ? styles.selected : ""}
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
                        initialDealInfo={dealInfo}
                    />
                    </div>
                </div>

                {/* 버튼 */}
                <hr className={styles.hr_bold} />
                <div className={styles.submitOption}>
                    <button type="submit" className={styles.submitOptionButton}>
                        수정하기
                    </button>
                </div>
            </form>

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
}
