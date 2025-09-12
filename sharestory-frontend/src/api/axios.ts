import axios from "axios";

const api = axios.create({
    baseURL: "/api", // 항상 /api로 시작 → dev에서는 vite proxy, prod에서는 nginx proxy
    withCredentials: true,
});

export default api;
