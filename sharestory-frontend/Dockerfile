# 1단계: React 빌드
FROM node:20 AS build
WORKDIR /app

# 의존성 먼저 (캐시 최적화)
COPY package*.json ./
RUN npm ci

# 환경파일(.env.production)과 소스 복사
# ⚠️ Vite에서 사용하는 키와 맞추세요: VITE_API_BASE=...
COPY .env.production ./.env.production
COPY . .

# 빌드
RUN npm run build

# 2단계: Nginx로 정적 서빙
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Nginx 설정 (SPA 라우팅 + API 프록시 + WebSocket 프록시)
RUN printf "server {\n\
  listen 80;\n\
  server_name _;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
\n\
  # React Router (SPA) 대응\n\
  location / {\n\
    try_files \$uri /index.html;\n\
  }\n\
\n\
  # 정적 자원 캐싱 (해시된 파일만 장기 캐싱)\n\
  location ~* \\.(?:css|js|svg|png|jpg|jpeg|gif|webp)$ {\n\
    add_header Cache-Control \"public, max-age=31536000, immutable\";\n\
    try_files \$uri /index.html;\n\
  }\n\
\n\
  # ✅ API 프록시 (Spring Boot backend:8081)\n\
  location /api/ {\n\
    proxy_pass http://backend:8081;\n\
    proxy_set_header Host \$host;\n\
    proxy_set_header X-Real-IP \$remote_addr;\n\
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\n\
    proxy_set_header X-Forwarded-Proto \$scheme;\n\
  }\n\
\n\
  # ✅ WebSocket 프록시 추가 (/ws-connect)\n\
  location /ws-connect/ {\n\
    proxy_pass http://backend:8081/ws-connect/;\n\
    proxy_http_version 1.1;\n\
    proxy_set_header Upgrade \$http_upgrade;\n\
    proxy_set_header Connection \"upgrade\";\n\
    proxy_set_header Host \$host;\n\
  }\n\
}\n" > /etc/nginx/conf.d/default.conf


# 빌드 결과 복사
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
