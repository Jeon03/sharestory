import { useEffect, useState } from "react";
import styles from "../css/AuctionPaymentTimer.module.css";

interface PaymentTimerProps {
    deadline: string;
    onExpire?: () => void;
}

export default function AuctionPaymentTimer({ deadline,onExpire  }: PaymentTimerProps) {
    const [timeLeft, setTimeLeft] = useState("");
    const [status, setStatus] = useState<"normal" | "warning" | "expired">("normal");

    useEffect(() => {
        const interval = setInterval(() => {
            const diff = new Date(deadline).getTime() - Date.now();

            if (diff <= 0) {
                setTimeLeft("시간 초과");
                setStatus("expired");
                clearInterval(interval);
                if (onExpire) onExpire();
                return;
            }

            const min = Math.floor(diff / 60000);
            const sec = Math.floor((diff % 60000) / 1000);

            if (min < 2) setStatus("warning");
            else setStatus("normal");

            setTimeLeft(`${min}분 ${sec.toString().padStart(2, "0")}초`);
        }, 1000);

        return () => clearInterval(interval);
    }, [deadline, onExpire]);

    const boxClass =
        status === "expired"
            ? `${styles["ss-payment-timer-box"]} ${styles["ss-timer-expired"]}`
            : status === "warning"
                ? `${styles["ss-payment-timer-box"]} ${styles["ss-timer-warning"]}`
                : `${styles["ss-payment-timer-box"]} ${styles["ss-timer-normal"]}`;

    return (
        <div className={boxClass}>
      <span className={styles["ss-payment-timer-icon"]}>
        {status === "expired" ? "❌" : status === "warning" ? "⏳" : "⏳"}
      </span>
            <span>
        {status === "expired"
            ? "결제 시간이 만료되었습니다."
            : `남은 결제 시간: `}
      </span>
            {status !== "expired" && (
                <span className={styles["ss-payment-timer-text"]}>{timeLeft}</span>
            )}
        </div>
    );
}
