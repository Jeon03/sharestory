FROM eclipse-temurin:21-jdk as builder
WORKDIR /app
COPY gradlew ./
COPY gradle gradle
COPY build.gradle settings.gradle ./
COPY src src
RUN chmod +x ./gradlew
RUN ./gradlew clean bootJar -x test

FROM eclipse-temurin:21-jdk
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
