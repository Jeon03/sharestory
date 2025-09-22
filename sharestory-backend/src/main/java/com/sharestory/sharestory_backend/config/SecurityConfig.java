package com.sharestory.sharestory_backend.config;

import com.sharestory.sharestory_backend.security.CustomOAuth2UserService;
import com.sharestory.sharestory_backend.security.JwtAuthenticationFilter;
import com.sharestory.sharestory_backend.security.OAuth2SuccessHandler;
import jakarta.servlet.http.Cookie;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService oAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final JwtAuthenticationFilter jwtFilter;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // CSRF: REST API + JWT 방식에서는 disable
                .csrf(AbstractHttpConfigurer::disable)

                // CORS: 프론트엔드 도메인 허용
                .cors(c -> c.configurationSource(corsSource()))

                // 인가 정책
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/health",
                                "/error",
                                "/oauth2/**",        // 소셜 로그인 진입
                                "/login/**",         // OAuth2 Callback
                                "/auth/**",         //토큰 재발급, 로그아웃 API
                                "/actuator/**",
                                "/api/allItems",
                                "/api/items/sorted/**",
                                "/api/items/**",
                                "/api/map/**",
                                "/api/favorites/**",
                                "/api/main",
                                "/api/items/autocomplete"
                        ).permitAll()
                        .requestMatchers(
                                "/api/users/location",
                                "/registerItem"


                        ).authenticated()
                        .anyRequest().authenticated()
                )

                // 기본 로그인/HTTP Basic 비활성화
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)

                // OAuth2 로그인
                .oauth2Login(o -> o
                        .userInfoEndpoint(u -> u.userService(oAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                )

                // JWT 인증 필터 추가
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)

                // 로그아웃 시 쿠키 삭제
                .logout(l -> l
                        .logoutUrl("/logout")
                        .logoutSuccessHandler((req, res, authn) -> {
                            Cookie access = new Cookie("ACCESS_TOKEN", null);
                            access.setMaxAge(0);
                            access.setPath("/");
                            access.setHttpOnly(true); // ✅ JWT는 HttpOnly 쿠키
                            access.setSecure(true);   // ✅ HTTPS 배포 환경이면 필수
                            res.addCookie(access);

                            Cookie refresh = new Cookie("REFRESH_TOKEN", null);
                            refresh.setMaxAge(0);
                            refresh.setPath("/");
                            refresh.setHttpOnly(true);
                            refresh.setSecure(true);
                            res.addCookie(refresh);

                            res.setStatus(200);
                            res.setContentType("application/json");
                            res.getWriter().write("{\"success\":true}");
                        })
                );
        return http.build();
    }

    // CORS 설정: 프론트엔드 도메인만 허용 + 쿠키 전송 허용
    @Bean
    CorsConfigurationSource corsSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of(frontendUrl)); // e.g. http://localhost:5173
        cfg.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(true); // 쿠키 전송 허용

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
