// 경로: src/main/java/com/sharestory/sharestory_backend/SharestoryBackendApplication.java
package com.sharestory; // ✅ 패키지 경로 수정

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.TimeZone;

@EnableJpaAuditing
@SpringBootApplication
public class SharestoryBackendApplication {

	@PostConstruct
	public void init() {
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
	}

	public static void main(String[] args) {
		SpringApplication.run(SharestoryBackendApplication.class, args);
	}

}