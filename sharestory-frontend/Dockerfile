# ==============================
# 1단계: React(Vite) 빌드
# ==============================
FROM node:20 AS build
WORKDIR /app

# 패키지 먼저 복사 (캐시 최적화)
COPY package*.json ./
RUN npm ci

# 환경 변수 및 소스 복사
# ⚠️ Vite는 빌드 시 .env.production 을 읽어서 포함시킴
COPY .env.production ./.env.production
COPY . .

# Vite 빌드
RUN npm run build

# ==============================
# 2단계: Nginx로 정적 파일 서빙
# ==============================
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# 서울 타임존 설정 (로그 타임 보정)
RUN apk add --no-cache tzdata && cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime

# Nginx 설정 (SPA 라우팅 전용 — 백엔드 직접 호출이라 프록시 불필요)
RUN printf "server {\n\
  listen 80;\n\
  server_name _;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
\n\
  # React Router (SPA 라우팅 처리)\n\
  location / {\n\
    try_files \$uri /index.html;\n\
  }\n\
\n\
  # 정적 자원 캐싱 (Vite 해시된 파일)\n\
  location ~* \\.(?:css|js|svg|png|jpg|jpeg|gif|webp)$ {\n\
    add_header Cache-Control \"public, max-age=31536000, immutable\";\n\
    try_files \$uri /index.html;\n\
  }\n\
\n\
  # Gzip 압축 활성화 (속도 향상)\n\
  gzip on;\n\
  gzip_types text/plain text/css application/json application/javascript;\n\
}\n" > /etc/nginx/conf.d/default.conf

# 빌드 결과 복사
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
