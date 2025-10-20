# ==============================
# 1단계: React(Vite) 빌드
# ==============================
FROM node:20 AS build
WORKDIR /app

# 패키지 복사 및 설치 (캐시 최적화)
COPY package*.json ./
RUN npm ci

# 환경 변수 및 소스 복사
COPY .env.production ./
COPY . .

# Vite 빌드
RUN npm run build


# ==============================
# 2단계: Nginx로 정적 파일 서빙 + 백엔드 프록시
# ==============================
FROM nginx:1.25
WORKDIR /usr/share/nginx/html

# 타임존 설정 (Asia/Seoul)
RUN apt-get update && apt-get install -y tzdata && \
    ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime && \
    echo "Asia/Seoul" > /etc/timezone && \
    rm -rf /var/lib/apt/lists/*

# Nginx 설정 파일 복사 (백엔드 프록시 + JWT 쿠키 전달 포함)
COPY ../nginx/default.conf /etc/nginx/conf.d/default.conf

# 빌드 결과 복사
COPY --from=build /app/dist /usr/share/nginx/html

# 포트 노출
EXPOSE 80

# 실행 명령
CMD ["nginx", "-g", "daemon off;"]
