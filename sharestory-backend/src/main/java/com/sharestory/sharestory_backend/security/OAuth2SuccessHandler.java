package com.sharestory.sharestory_backend.security;

import com.sharestory.sharestory_backend.domain.RefreshToken;
import com.sharestory.sharestory_backend.repo.RefreshTokenRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtService jwt;
    private final RefreshTokenRepository refreshRepo;

    @Value("${app.frontend-url}")
    private String FRONT;

    @Value("${app.cookie.domain}")
    private String COOKIE_DOMAIN;

    @Value("${app.cookie.secure:false}")
    private boolean COOKIE_SECURE;

    @Value("${app.cookie.same-site:Lax}")
    private String COOKIE_SAME_SITE;

    // ✅ application.yml 에서 읽어온 토큰 수명
    @Value("${app.jwt.access-exp-seconds}")
    private long ACCESS_EXP;

    @Value("${app.jwt.refresh-exp-seconds}")
    private long REFRESH_EXP;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest req,
                                        HttpServletResponse res,
                                        Authentication authentication) {

        // ✅ CustomUserDetails 로 캐스팅
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getId();
        String role = userDetails.getRole();

        // 토큰 발급
        String access = jwt.createAccessToken(userId, role);
        String refresh = jwt.createRefreshToken(userId);

        // RefreshToken 저장 또는 갱신
        upsertRefreshToken(userId, refresh);

        // ✅ 만료시간을 직접 파싱하지 않고 설정값 그대로 사용
        CookieUtil.addCookie(res, "ACCESS_TOKEN", access,
                (int) ACCESS_EXP, COOKIE_DOMAIN, COOKIE_SECURE, COOKIE_SAME_SITE);

        CookieUtil.addCookie(res, "REFRESH_TOKEN", refresh,
                (int) REFRESH_EXP, COOKIE_DOMAIN, COOKIE_SECURE, COOKIE_SAME_SITE);

        // 로그인 성공 후 프론트엔드로 리다이렉트
        res.setStatus(HttpServletResponse.SC_FOUND);
        res.setHeader("Location", FRONT + "/");
    }


    private void upsertRefreshToken(Long userId, String refresh) {
        String hash = sha256(refresh);
        refreshRepo.findByUserId(userId).ifPresentOrElse(rt -> {
            rt.setTokenHash(hash);
            rt.setExpiresAt(Instant.now().plusSeconds(REFRESH_EXP));
            refreshRepo.save(rt);
        }, () -> refreshRepo.save(RefreshToken.builder()
                .userId(userId)
                .tokenHash(hash)
                .expiresAt(Instant.now().plusSeconds(REFRESH_EXP))
                .build()));
    }

    private static String sha256(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder()
                    .encodeToString(md.digest(s.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
