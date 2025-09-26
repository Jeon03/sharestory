package com.sharestory.sharestory_backend.security;

import com.sharestory.sharestory_backend.domain.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Collections;
import java.util.Date;
import java.util.Map;
@Slf4j
@Component
public class JwtService {
    private final SecretKey key;
    private final long accessExpSec;
    private final long refreshExpSec;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.access-exp-seconds}") long accessExpSec,
                      @Value("${app.jwt.refresh-exp-seconds}") long refreshExpSec) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessExpSec = accessExpSec;
        this.refreshExpSec = refreshExpSec;
    }

    public String createAccessToken(Long userId, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .addClaims(Map.of("role", role))
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(accessExpSec)))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String createRefreshToken(Long userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .claim("type", "refresh")
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(refreshExpSec)))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Jws<Claims> parse(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
    }

    // ✅ 토큰 유효성 검사 (상세 로그 포함)
    public boolean validateToken(String token) {
        try {
            parse(token); // 유효하면 그냥 통과
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("❌ JWT 만료: {}", e.getMessage());
        } catch (io.jsonwebtoken.security.SignatureException e) {
            log.warn("❌ JWT 서명 불일치: {}", e.getMessage());
        } catch (Exception e) {
            log.warn("❌ JWT 파싱 오류: {}", e.getMessage());
        }
        return false;
    }

    // ✅ StompAuthInterceptor / JwtAuthenticationFilter 에서 사용할 Authentication 반환
    public Authentication getAuthentication(String token) {
        Claims claims = parse(token).getBody();

        Long userId = Long.valueOf(claims.getSubject());
        String role = claims.get("role", String.class);
        String nickname = claims.get("nickname", String.class); // 필요하다면 nickname도 넣기

        // DB를 안 거치고 최소한의 정보만 담은 User 객체 생성
        User tempUser = new User();
        tempUser.setId(userId);
        tempUser.setRole(role);
        tempUser.setNickname(nickname);

        CustomUserDetails userDetails = new CustomUserDetails(tempUser);

        return new UsernamePasswordAuthenticationToken(
                userDetails,              // principal
                null,                     // credentials
                userDetails.getAuthorities()
        );
    }

    // ✅ STOMP Header에서 토큰 추출 (Cookie/Authorization Header 처리)
    public String resolveTokenFromCookieOrHeader(StompHeaderAccessor accessor) {
        // 1) Authorization 헤더 (대소문자 모두 체크)
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null) {
            authHeader = accessor.getFirstNativeHeader("authorization");
        }
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            log.debug("📌 Authorization 헤더에서 토큰 추출 = {}", token);
            return token;
        }

        // 2) Cookie (대소문자 모두 처리)
        String cookieHeader = accessor.getFirstNativeHeader("Cookie");
        if (cookieHeader == null) {
            cookieHeader = accessor.getFirstNativeHeader("cookie");
        }

        if (cookieHeader != null) {
            log.debug("📌 Cookie Header = {}", cookieHeader);
            for (String cookie : cookieHeader.split(";")) {
                cookie = cookie.trim();
                String lower = cookie.toLowerCase();

                if (lower.startsWith("access_token=")) {
                    String token = cookie.substring(cookie.indexOf("=") + 1).trim();
                    log.debug("📌 쿠키(access_token)에서 토큰 추출 = {}", token);
                    return token;
                }
                if (lower.startsWith("access_token".toLowerCase())) {
                    String token = cookie.substring(cookie.indexOf("=") + 1).trim();
                    log.debug("📌 쿠키(ACCESS_TOKEN)에서 토큰 추출 = {}", token);
                    return token;
                }
            }
        }

        log.warn("❌ STOMP Header에서 토큰을 찾을 수 없음");
        return null;
    }

}
