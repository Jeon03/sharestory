import { useState } from "react";

export default function useUserLocation() {
    const [locating, setLocating] = useState(false);

    const locate = () => {
        if (!navigator.geolocation) {
            alert("이 브라우저는 위치 서비스를 지원하지 않습니다.");
            return;
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    const res = await fetch(
                        `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${longitude}&y=${latitude}`,
                        {
                            headers: {
                                Authorization: `KakaoAK ${import.meta.env.VITE_KAKAO_REST_KEY}`,
                            },
                        }
                    );
                    const data = await res.json();
                    const address = data.documents?.[0]?.address?.address_name;
                    if (address) {
                        alert(`현재 위치: ${address}`);
                    } else {
                        alert("주소를 찾을 수 없습니다.");
                    }
                } catch (e) {
                    console.error("주소 정보 에러:", e);
                    alert("주소 정보를 불러오는 중 오류 발생");
                }
                setLocating(false);
            },
            (err) => {
                console.error(err);
                alert("위치 정보를 가져올 수 없습니다.");
                setLocating(false);
            }
        );
    };

    return { locate, locating };
}
