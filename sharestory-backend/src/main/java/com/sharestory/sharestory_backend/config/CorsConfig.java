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
            @Value("${app.cors.origins:http://localhost:5173,http://localhost:3000}") String origins
    ) {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins(origins.split(","))
                        .allowedMethods("GET","POST","PUT","PATCH","DELETE","OPTIONS")
                        .allowCredentials(true);
            }
        };
    }
}