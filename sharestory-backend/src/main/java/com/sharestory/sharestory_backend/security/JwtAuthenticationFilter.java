package com.sharestory.sharestory_backend.security;

import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.repo.UserRepository;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.slf4j.Logger;
import java.io.IOException;



@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwt;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {

        String path = req.getRequestURI();

        if (path.startsWith("/oauth2/") ||
                path.startsWith("/login/") ||
                path.startsWith("/auth/") ||
                path.equals("/error") ||
                path.equals("/api/health") ||
                path.startsWith("/ws-connect/")) {   // 🔥 SockJS 경로 추가
            chain.doFilter(req, res);
            return;
        }

        String token = resolveBearer(req);
        if (!StringUtils.hasText(token)) {
            token = CookieUtil.getCookie(req, "ACCESS_TOKEN");
        }

        if (StringUtils.hasText(token)) {
            try {
                var claims = jwt.parse(token).getBody();
                Long userId = Long.valueOf(claims.getSubject());

                User userEntity = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found: " + userId));

                CustomUserDetails userDetails = new CustomUserDetails(userEntity);

                var auth = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );

                SecurityContextHolder.getContext().setAuthentication(auth);

            } catch (ExpiredJwtException e) {
                log.warn("❌ Access Token 만료: {}", e.getMessage());
                SecurityContextHolder.clearContext();
            } catch (Exception e) {
                log.error("❌ JWT 검증 실패: {}", e.getMessage());
                SecurityContextHolder.clearContext();
            }
        }

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
