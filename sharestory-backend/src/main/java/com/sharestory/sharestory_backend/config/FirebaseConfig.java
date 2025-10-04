package com.sharestory.sharestory_backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void init() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                String firebaseKey = System.getenv("FIREBASE_SERVICE_KEY");

                if (firebaseKey == null || firebaseKey.isEmpty()) {
                    throw new IllegalStateException("환경 변수 FIREBASE_SERVICE_KEY가 설정되지 않았습니다.");
                }

                // 🔽 문자열(JSON)을 InputStream으로 변환
                var stream = new ByteArrayInputStream(firebaseKey.getBytes(StandardCharsets.UTF_8));

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(stream))
                        .build();

                FirebaseApp.initializeApp(options);
                System.out.println("✅ FirebaseApp 환경변수 기반 초기화 완료");
            } else {
                System.out.println("ℹ️ FirebaseApp 이미 초기화됨");
            }
        } catch (Exception e) {
            System.err.println("❌ Firebase 초기화 실패: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Bean
    public FirebaseMessaging firebaseMessaging() throws Exception {
        String firebaseKey = System.getenv("FIREBASE_SERVICE_KEY");

        if (firebaseKey == null || firebaseKey.isEmpty()) {
            throw new IllegalStateException("❌ 환경 변수 FIREBASE_SERVICE_KEY가 설정되지 않았습니다.");
        }

        FirebaseApp firebaseApp;
        if (FirebaseApp.getApps().isEmpty()) {
            var stream = new ByteArrayInputStream(firebaseKey.getBytes(StandardCharsets.UTF_8));

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(stream))
                    .build();

            firebaseApp = FirebaseApp.initializeApp(options);
            System.out.println("✅ FirebaseApp 환경변수 기반 초기화 완료");
        } else {
            firebaseApp = FirebaseApp.getInstance();
            System.out.println("ℹ️ FirebaseApp 재사용");
        }

        return FirebaseMessaging.getInstance(firebaseApp);
    }
}