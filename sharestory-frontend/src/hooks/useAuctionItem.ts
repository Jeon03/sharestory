import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ItemDetail, User } from '../types/auction';

// --- [수정된 부분 1] ---
// VITE_API_BASE 변수는 더 이상 사용하지 않으므로 관련 코드를 삭제합니다.
 const API_BASE = import.meta.env.VITE_API_BASE || '';

export function useAuctionItem() {
    // 1. 기본 Hooks 및 상태 변수 선언
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [item, setItem] = useState<ItemDetail | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [highestBid, setHighestBid] = useState<number>(0);
    const [highestBidderName, setHighestBidderName] = useState<string | null>(null);

    // 2. 초기 데이터 페칭을 위한 useEffect
    useEffect(() => {
        if (!id) {
            navigate('/auctions');
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [itemRes, userRes] = await Promise.all([
                    // --- [수정된 부분 2] ---
                    // fetch 경로에 '/api'를 직접 추가합니다.
                    fetch(`${API_BASE}/auction-items/${id}`, { credentials: 'include' }),
                    fetch(`${API_BASE}/main`, { credentials: 'include' })
                ]);

                if (!itemRes.ok) {
                    throw new Error('상품 데이터를 불러오는 데 실패했습니다.');
                }

                const itemData: ItemDetail = await itemRes.json();
                setItem(itemData);
                setHighestBid(itemData.finalBidPrice || itemData.minPrice);
                setHighestBidderName(itemData.highestBidder?.nickname || null);

                if (userRes.ok) {
                    const userData: User = await userRes.json();
                    setCurrentUser(userData);
                } else {
                    setCurrentUser(null);
                    console.warn('사용자 정보를 불러오지 못했습니다. (비로그인 상태)');
                }

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
                setError(errorMessage);
                console.error(errorMessage);
                alert(errorMessage);
                navigate('/auctions');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, navigate]);

    // 3. SSE 실시간 연결을 위한 useEffect
    useEffect(() => {
        if (!id || !currentUser) {
            return;
        }

        console.log("SSE 연결을 시도합니다...");
        // --- [수정된 부분 3] ---
        // SSE 연결 경로에도 '/api'를 직접 추가합니다.
        const eventSource = new EventSource(`${API_BASE}/sse/connect`, { withCredentials: true });

        eventSource.onopen = () => {
            console.log("SSE 연결이 성공적으로 수립되었습니다.");
        };

        eventSource.addEventListener('new-activity', (event) => {
            console.log('SSE 이벤트 수신:', event.data);
            try {
                const updatedData = JSON.parse(event.data);

                if (updatedData.newHighestBid) {
                    setHighestBid(updatedData.newHighestBid);
                }
                if (updatedData.newBidderName) {
                    setHighestBidderName(updatedData.newBidderName);
                }
            } catch (e) {
                console.error('SSE 이벤트 데이터 파싱 실패:', e);
            }
        });

        eventSource.onerror = (error) => {
            console.error("SSE 연결 오류:", error);

            eventSource.close();
        };

        return () => {
            console.log("컴포넌트 언마운트로 SSE 연결을 종료합니다.");
            eventSource.close();
        };
    }, [id, currentUser]);


    // 4. 컴포넌트에서 사용할 상태와 함수들을 반환
    return {
        id,
        item,
        currentUser,
        loading,
        error,
        highestBid,
        setHighestBid,
        highestBidderName,
        setHighestBidderName,
        setCurrentUser,
    };
}