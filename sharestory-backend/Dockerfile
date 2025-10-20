# ==============================
# 1단계: Gradle 빌드 (JDK 21)
# ==============================
FROM openjdk:21-jdk-slim AS builder
WORKDIR /app

# Gradle Wrapper 및 소스 복사
COPY gradlew .
COPY gradle ./gradle
COPY build.gradle settings.gradle ./
COPY src ./src

# ✅ gradlew 실행 권한 부여
RUN chmod +x ./gradlew

# ✅ Gradle 빌드 (테스트 제외)
RUN ./gradlew clean bootJar -x test --build-cache

# ==============================
# 2단계: 실행 이미지 (JDK 21)
# ==============================
FROM openjdk:21-jdk-slim
WORKDIR /app

# 빌드된 JAR 복사
COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]
