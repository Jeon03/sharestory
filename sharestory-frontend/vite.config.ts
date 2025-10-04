import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // localhost를 ec2 ip로 변경
      '/api':    { target: 'http://localhost:8081', changeOrigin: true },
      '/auth':   { target: 'http://localhost:8081', changeOrigin: true },
      '/oauth2': { target: 'http://localhost:8081', changeOrigin: true },
      '/login':  { target: 'http://localhost:8081', changeOrigin: true }, // login/oauth2/*
      '/logout': { target: 'http://localhost:8081', changeOrigin: true },
        "/ws": {target: "http://localhost:8081", changeOrigin: true, ws: true, // ✅ WebSocket 프록시 활성화
        },
        "/ws-connect": {target: "http://localhost:8081", changeOrigin: true, ws: true, // ✅ WebSocket 프록시 활성화
        },
    },
  },
  define: {
    global: "window", //
  },
})

