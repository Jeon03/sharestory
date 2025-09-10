package com.sharestory.sharestory_backend.security;

import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.repo.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwt;
    private final UserRepository userRepository; // ✅ User DB 조회용

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {

        String path = req.getRequestURI();

        // ✅ 공개 엔드포인트는 JWT 검사 스킵
        if (path.startsWith("/oauth2/") ||
                path.startsWith("/login/") ||
                path.startsWith("/auth/") ||
                path.equals("/error") ||
                path.equals("/api/health")) {
            chain.doFilter(req, res);
            return;
        }

        // 1) 헤더에서 Bearer 토큰 추출
        String token = resolveBearer(req);

        // 2) 없으면 쿠키에서 꺼내기
        if (!StringUtils.hasText(token)) {
            token = CookieUtil.getCookie(req, "ACCESS_TOKEN");
        }

        // 3) 토큰이 있으면만 파싱 시도
        if (StringUtils.hasText(token)) {
            try {
                var claims = jwt.parse(token).getBody();
                Long userId = Long.valueOf(claims.getSubject());
                String role = (String) claims.get("role");

                // ✅ DB에서 사용자 조회 후 CustomUserDetails 생성
                User userEntity = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found: " + userId));

                CustomUserDetails userDetails = new CustomUserDetails(userEntity);

                var auth = new UsernamePasswordAuthenticationToken(
                        userDetails,                // principal = CustomUserDetails
                        null,
                        userDetails.getAuthorities()
                );

                SecurityContextHolder.getContext().setAuthentication(auth);

            } catch (Exception e) {
                // ❗ 토큰 유효하지 않으면 무시 → 로그인 전 상태 유지
                SecurityContextHolder.clearContext();
            }
        }

        // 4) 필터 체인 계속 진행
        chain.doFilter(req, res);
    }

    private String resolveBearer(HttpServletRequest req) {
        String h = req.getHeader("Authorization");
        if (StringUtils.hasText(h) && h.startsWith("Bearer ")) {
            return h.substring(7);
        }
        return null;
    }
}
