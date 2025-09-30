package com.sharestory.sharestory_backend.fcm;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;

@Slf4j
@Service
public class FirebaseInitializer {

    @PostConstruct // Spring 애플리케이션이 시작될 때 이 메서드를 자동으로 실행합니다.
    public void initialize() {
        try {
            // 1단계에서 다운로드한 서비스 계정 키 파일의 경로를 지정합니다.
            // "firebase/" 경로를 추가해줍니다.
            ClassPathResource resource = new ClassPathResource("firebase/serviceAccountKey.json");
            try (InputStream serviceAccount = resource.getInputStream()) {
                // Firebase Admin SDK 초기화
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();

                // 이미 초기화되었는지 확인하여 중복 초기화를 방지합니다.
                if (FirebaseApp.getApps().isEmpty()) {
                    FirebaseApp.initializeApp(options);
                    log.info("✅ Firebase Admin SDK가 성공적으로 초기화되었습니다.");
                }
            }
        } catch (IOException e) {
            log.error("❌ Firebase Admin SDK 초기화에 실패했습니다.", e);
        }
    }
}