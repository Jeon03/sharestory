export type CourierOption = {
    value: string;   // 서버에 보낼 코드
    label: string;   // 화면 표기
    hint?: string;   // 예: '숫자만 12~14자리'
    pattern?: RegExp; // 간단 검증 패턴 (선택)
};

export const COURIERS: CourierOption[] = [
    { value: "CJ", label: "CJ대한통운", hint: "숫자 10~12자리", pattern: /^[0-9-]{10,14}$/ },
    { value: "LOTTE", label: "롯데택배", hint: "숫자 10~12자리", pattern: /^[0-9-]{10,14}$/ },
    { value: "HANJIN", label: "한진택배", hint: "숫자 10~12자리", pattern: /^[0-9-]{10,14}$/ },
    { value: "POST", label: "우체국택배", hint: "숫자/하이픈", pattern: /^[0-9-]{8,14}$/ },

    { value: "ETC", label: "기타(직접입력)" },
];
