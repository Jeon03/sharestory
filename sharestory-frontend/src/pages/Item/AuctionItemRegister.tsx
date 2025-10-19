import { useEffect, useRef, useState } from "react";
import styles from "../../css/AuctionSalesPage.module.css";
import AuctionWarningModal from "../../components/AuctionWarningModal";
import Category from "../../components/Category";
import ImmediatePurchaseSection from "../../components/ImmediatePurchaseSection";

const MAX_IMAGES = 3;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

const AuctionItemRegister = () => {
    // 기본 정보
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [selectedCondition, setSelectedCondition] = useState("중고상품");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [productName, setProductName] = useState("");
    const [productExplain, setProductExplain] = useState("");
    const [showAgreeModal, setShowAgreeModal] = useState(false);

    // 경매 관련
    const [startPrice, setStartPrice] = useState("");
    const [bidUnit, setBidUnit] = useState("");
    const [endDateTime, setEndDateTime] = useState("");

    // 즉시구매 관련
    const [isImmediatePurchase, setIsImmediatePurchase] = useState<"yes" | "no">("no");
    const [immediatePrice, setImmediatePrice] = useState("");
    const [priceError, setPriceError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleSubmit = async () => {
        try {

            if (!endDateTime) {
                alert("경매 종료일시를 입력해주세요.");
                return;
            }

            const selected = new Date(endDateTime);
            const now = new Date();
            const diffMs = selected.getTime() - now.getTime();

            if (diffMs < 3 * 60 * 1000) {
                alert("경매 종료일시는 현재 시간으로부터 최소 3분 이후로 설정해야 합니다.");
                return;
            }

            if (diffMs > 7 * 24 * 60 * 60 * 1000) {
                alert("경매 종료일시는 최대 1주일 이내로 설정해야 합니다.");
                return;
            }


            const formData = new FormData();

            // 기본 상품 정보
            formData.append("title", productName);
            formData.append("category", selectedCategory);
            formData.append("condition", selectedCondition);
            formData.append("description", productExplain);

            // 경매 정보
            formData.append("startPrice", startPrice.replace(/,/g, ""));
            formData.append("bidUnit", bidUnit.replace(/,/g, ""));
            formData.append("endDateTime", endDateTime);

            // 즉시구매 정보
            formData.append("isImmediatePurchase", isImmediatePurchase); // "yes" | "no"
            if (isImmediatePurchase === "yes" && immediatePrice) {
                formData.append("immediatePrice", immediatePrice.replace(/,/g, ""));
            }

            // 이미지 파일 추가
            images.forEach((file) => formData.append("images", file));

            // 서버 요청
            const response = await fetch("/api/auctions/register", {
                method: "POST",
                body: formData,
                credentials: "include", // 로그인 세션 유지용 (OAuth2 포함)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "서버 오류가 발생했습니다.");
            }

            alert("✅ 경매 상품이 등록되었습니다!");
            window.location.href = "/auction";

        } catch (error) {
            console.error(error);
            alert("등록 실패: " + (error as Error).message);
        }
    };

    // ✅ 즉시구매가 실시간 유효성 검사
    useEffect(() => {
        if (isImmediatePurchase === "yes") {
            const start = Number(startPrice.replace(/,/g, "") || 0);
            const immediate = Number(immediatePrice.replace(/,/g, "") || 0);

            if (immediate && start && immediate <= start) {
                setPriceError("즉시구매가는 시작가보다 높아야 합니다.");
            } else {
                setPriceError(null);
            }
        } else {
            setPriceError(null);
        }
    }, [isImmediatePurchase, startPrice, immediatePrice]);

    const isFormValid = Boolean(
        productName &&
        selectedCategory &&
        images.length > 0 &&
        selectedCondition &&
        startPrice &&
        bidUnit &&
        productExplain &&
        endDateTime &&
        !priceError
    );

    // ✅ 파일 업로드
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? []);
        const valid = selected.filter((f) => ACCEPTED.includes(f.type));

        if (valid.length !== selected.length) {
            alert("이미지 파일(jpeg/png/webp)만 업로드할 수 있어요.");
        }

        const merged = [...images, ...valid].filter(
            (f, idx, arr) => arr.findIndex((x) => x.name === f.name && x.size === f.size) === idx
        );

        const limited = merged.slice(0, MAX_IMAGES);
        if (merged.length > MAX_IMAGES) {
            alert(`이미지는 최대 ${MAX_IMAGES}장까지 업로드할 수 있어요.`);
        }

        setImages(limited);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // ✅ 미리보기 관리
    useEffect(() => {
        const urls = images.map((f) => URL.createObjectURL(f));
        setPreviews(urls);
        return () => urls.forEach((u) => URL.revokeObjectURL(u));
    }, [images]);

    // ✅ 이미지 삭제
    const removeAt = (idx: number) => {
        const next = [...images];
        next.splice(idx, 1);
        setImages(next);
    };

    // ✅ 가격 입력 시 자동 콤마 처리
    const handlePriceChange =
        (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value.replace(/\D/g, "");
            setter(value ? value.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "");
        };

    // ✅ 날짜 제한
    const now = new Date();
    const minDate = new Date(now.getTime() + 3 * 60 * 1000); // 현재시간 + 3분
    const maxDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1주일 뒤
    const formatDate = (d: Date) => d.toISOString().slice(0, 16);

    return (
        <section className={styles.saleProduct}>
            <h2 className={styles.h2_top}>경매 상품정보</h2>
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
                                    style={{ display: "none" }}
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="image-input" className={styles.uploadTile}>
                  <span>
                    이미지등록
                    <br />+
                  </span>
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
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        {Array.from({
                            length: Math.max(
                                0,
                                MAX_IMAGES - (images.length + (images.length < MAX_IMAGES ? 1 : 0))
                            ),
                        }).map((_, i) => (
                            <div key={`empty-${i}`} className={styles.emptySlot} />
                        ))}
                    </div>
                    <p className={styles.helperText}>
                        jpeg/png/webp 최대 {MAX_IMAGES}장 업로드
                    </p>
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

                {/* 상품 설명 */}
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

                {/* 경매 섹션 */}
                <h2 className={styles.h2}>경매 정보</h2>
                <hr className={styles.hr_bold} />

                {/* 시작가 */}
                <div className={styles.price}>
                    <h4>경매 시작가</h4>
                    <div className={styles.priceInputWrapper}>
                        <input
                            type="text"
                            placeholder="시작가를 입력해주세요."
                            value={startPrice}
                            maxLength={12}
                            onChange={handlePriceChange(setStartPrice)}
                        />
                        <span className={styles.won}>원</span>
                    </div>
                </div>

                {/* 입찰 단위 */}
                <hr className={styles.hr} />
                <div className={styles.bidUnit}>
                    <h4>입찰 단위</h4>
                    <div className={styles.priceInputWrapper}>
                        <input
                            type="text"
                            placeholder="입찰 단위를 입력해주세요."
                            value={bidUnit}
                            maxLength={12}
                            onChange={handlePriceChange(setBidUnit)}
                        />
                        <span className={styles.won}>원</span>
                    </div>
                </div>

                {/* 즉시구매 여부 */}
                <hr className={styles.hr} />
                <ImmediatePurchaseSection
                    isImmediatePurchase={isImmediatePurchase}
                    immediatePrice={immediatePrice}
                    setIsImmediatePurchase={setIsImmediatePurchase}
                    setImmediatePrice={setImmediatePrice}
                />
                {priceError && (
                    <p style={{ color: "red", fontSize: "13px", marginTop: "4px" }}>{priceError}</p>
                )}

                {/* 종료일시 */}
                <hr className={styles.hr} />
                <div className={styles.endDateTime}>
                    <h4>경매 종료일시</h4>
                    <input
                        type="datetime-local"
                        value={endDateTime}
                        onChange={(e) => setEndDateTime(e.target.value)}
                        min={formatDate(minDate)}
                        max={formatDate(maxDate)}
                    />
                    <p className={styles.helperText}>
                        현재 시각 기준 최소 3분 이후부터, 최대 1주일 이내로 설정 가능합니다.
                    </p>
                </div>


                {/* 등록 버튼 */}
                <hr className={styles.hr_bold} />
                <div className={styles.submitOption}>
                    <button
                        type="submit"
                        className={styles.submitOptionButton}
                        disabled={!isFormValid}
                    >
                        등록하기
                    </button>
                </div>
            </form>

            {showAgreeModal && (
                <AuctionWarningModal
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

export default AuctionItemRegister;
