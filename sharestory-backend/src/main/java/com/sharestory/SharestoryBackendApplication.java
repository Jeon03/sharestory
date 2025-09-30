package com.sharestory;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing; // ✅ import 추가

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
