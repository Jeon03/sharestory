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

    private boolean firebaseEnabled = false; // ✅ Firebase 활성화 여부 플래그

    @PostConstruct
    public void init() {
        try {
            String firebaseKey = System.getenv("FIREBASE_SERVICE_KEY");

            if (firebaseKey == null || firebaseKey.isEmpty()) {
                System.out.println("⚠️ 환경 변수 FIREBASE_SERVICE_KEY 미설정 → FCM 비활성화");
                return;
            }

            if (FirebaseApp.getApps().isEmpty()) {
                var stream = new ByteArrayInputStream(firebaseKey.getBytes(StandardCharsets.UTF_8));
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(stream))
                        .build();

                FirebaseApp.initializeApp(options);
                firebaseEnabled = true;
                System.out.println("✅ FirebaseApp 환경변수 기반 초기화 완료");
            } else {
                firebaseEnabled = true;
                System.out.println("ℹ️ FirebaseApp 이미 초기화됨");
            }

        } catch (Exception e) {
            System.err.println("⚠️ Firebase 초기화 실패 (무시하고 서버 계속 실행): " + e.getMessage());
            firebaseEnabled = false;
        }
    }

    @Bean
    public FirebaseMessaging firebaseMessaging() {
        try {
            if (!firebaseEnabled || FirebaseApp.getApps().isEmpty()) {
                System.out.println("⚠️ FirebaseMessaging 비활성화 상태 → FCM 기능 사용 불가");
                return null;
            }

            FirebaseApp firebaseApp = FirebaseApp.getInstance();
            return FirebaseMessaging.getInstance(firebaseApp);

        } catch (Exception e) {
            System.err.println("⚠️ FirebaseMessaging Bean 생성 실패 (무시): " + e.getMessage());
            return null;
        }
    }
}
