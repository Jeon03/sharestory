
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api':    { target: 'http://localhost:8081', changeOrigin: true },
      '/auth':   { target: 'http://localhost:8081', changeOrigin: true },
      '/oauth2': { target: 'http://localhost:8081', changeOrigin: true },
      '/login':  { target: 'http://localhost:8081', changeOrigin: true }, // login/oauth2/*
      '/logout': { target: 'http://localhost:8081', changeOrigin: true },
    },
  },
})