
import { useEffect, useState } from "react";

interface PointHistory {
    id: number;
    amount: number;
    balance: number;
    type: string;
    description: string;
    createdAt: string;
}

export default function PointList({ userId }: { userId: number }) {
    const [history, setHistory] = useState<PointHistory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/points/history/${userId}`, { credentials: "include" })
            .then((res) => res.json())
            .then((data) => setHistory(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [userId]);

    if (loading) return <div>불러오는 중...</div>;

    if (history.length === 0) {
        return <div className="point-empty">포인트 사용 내역이 없습니다.</div>;
    }

    return (
        <div className="point-list">
            <h3>포인트 사용 내역</h3>
            <table>
                <thead>
                <tr>
                    <th>일시</th>
                    <th>내역</th>
                    <th>금액</th>
                    <th>잔액</th>
                </tr>
                </thead>
                <tbody>
                {history.map((h) => (
                    <tr key={h.id}>
                        <td>{new Date(h.createdAt).toLocaleString()}</td>
                        <td>{h.description || h.type}</td>
                        <td className={h.amount > 0 ? "plus" : "minus"}>
                            {h.amount > 0 ? `+${h.amount}` : h.amount}
                        </td>
                        <td>{h.balance} P</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
