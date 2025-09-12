package com.sharestory.sharestory_backend.web;


import com.sharestory.sharestory_backend.repo.RefreshTokenRepository;
import com.sharestory.sharestory_backend.security.CookieUtil;
import com.sharestory.sharestory_backend.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final JwtService jwt;
    private final RefreshTokenRepository refreshRepo;

    @Value("${app.cookie.domain}") String COOKIE_DOMAIN;
    @Value("${app.cookie.secure:false}") boolean COOKIE_SECURE;
    @Value("${app.cookie.same-site:Lax}") String COOKIE_SAME_SITE;

    @PostMapping("/token/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest req, HttpServletResponse res) {
        String refresh = CookieUtil.getCookie(req, "REFRESH_TOKEN");
        if (refresh == null) return ResponseEntity.status(401).body(Map.of("error","no_refresh"));

        Long userId;
        try {
            var claims = jwt.parse(refresh).getBody();
            if (!"refresh".equals(claims.get("type"))) throw new RuntimeException();
            userId = Long.valueOf(claims.getSubject());
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error","invalid_refresh"));
        }

        var saved = refreshRepo.findByUserId(userId).orElse(null);
        if (saved == null || !saved.getTokenHash().equals(sha256(refresh)) || saved.getExpiresAt().isBefore(Instant.now())) {
            return ResponseEntity.status(401).body(Map.of("error","refresh_not_found"));
        }

        String access = jwt.createAccessToken(userId, "ROLE_USER"); // role 필요 시 조회
        CookieUtil.addCookie(res, "ACCESS_TOKEN", access, 1800, COOKIE_DOMAIN, COOKIE_SECURE, COOKIE_SAME_SITE);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    private static String sha256(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder().encodeToString(md.digest(s.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) { throw new RuntimeException(e); }
    }
}