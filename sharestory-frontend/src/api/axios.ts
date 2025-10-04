import axios from "axios";

const api = axios.create({
    baseURL: "/api",
    withCredentials: true,
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            // 전역 이벤트 → AuthProvider가 구독 중
            window.dispatchEvent(new Event("open-login"));
        }
        return Promise.reject(err);
    }
);

export default api;
