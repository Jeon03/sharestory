import "../css/ImmediatePurchaseSection.css";

interface ImmediatePurchaseProps {
    isImmediatePurchase: "yes" | "no";
    immediatePrice: string;
    setIsImmediatePurchase: (v: "yes" | "no") => void;
    setImmediatePrice: (v: string) => void;
}

export default function ImmediatePurchaseSection({
                                                     isImmediatePurchase,
                                                     immediatePrice,
                                                     setIsImmediatePurchase,
                                                     setImmediatePrice,
                                                 }: ImmediatePurchaseProps) {
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "");
        setImmediatePrice(value ? value.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "");
    };

    return (
        <div className="immediate-container">
            <h4 className="immediate-title">즉시구매 여부</h4>

            <div className="immediate-radio">
                <label>
                    <input
                        type="radio"
                        name="immediate"
                        value="yes"
                        checked={isImmediatePurchase === "yes"}
                        onChange={() => setIsImmediatePurchase("yes")}
                    />{" "}
                    예
                </label>
                <label>
                    <input
                        type="radio"
                        name="immediate"
                        value="no"
                        checked={isImmediatePurchase === "no"}
                        onChange={() => setIsImmediatePurchase("no")}
                    />{" "}
                    아니오
                </label>
            </div>

            <div className={`immediate-dropdown ${isImmediatePurchase === "yes" ? "active" : ""}`}>
                <label className="immediate-label">즉시구매가</label>
                <div className="immediate-input-wrapper">
                    <input
                        type="text"
                        value={immediatePrice}
                        onChange={handlePriceChange}
                        placeholder="금액 입력"
                    />
                    <span>원</span>
                </div>
            </div>
        </div>
    );
}
