import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // --- [추가된 부분 시작] ---
  server: {
    proxy: {
      '/api':    { target: 'http://localhost:8081', changeOrigin: true },
      '/auth':   { target: 'http://localhost:8081', changeOrigin: true },
      '/oauth2': { target: 'http://localhost:8081', changeOrigin: true },
      '/login':  { target: 'http://localhost:8081', changeOrigin: true },
      '/logout': { target: 'http://localhost:8081', changeOrigin: true },
      '/ws': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        ws: true
      },
      '/ws-connect': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        ws: true
      },
    }
  },
  // --- [추가된 부분 끝] ---
  define: {
    global: "window",
  },
})