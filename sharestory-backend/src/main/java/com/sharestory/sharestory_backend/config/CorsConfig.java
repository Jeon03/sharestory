package com.sharestory.sharestory_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer(
            @Value("${app.cors.origins:http://localhost:5173,http://localhost:3000,http://3.39.215.194}") String origins
    ) {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins(origins.split(","))
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*")          // ? 헤더 전체 허용
                        .exposedHeaders("Set-Cookie") // ? 쿠키 헤더 노출
                        .allowCredentials(true);       // ? 쿠키 포함 허용
            }
        };
    }
}
