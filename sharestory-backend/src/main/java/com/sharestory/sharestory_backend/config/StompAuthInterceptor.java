package com.sharestory.sharestory_backend.config;

import com.sharestory.sharestory_backend.security.JwtService;
import io.jsonwebtoken.ExpiredJwtException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Slf4j
@Component
public class StompAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    public StompAuthInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) return message;

        StompCommand command = accessor.getCommand();
        log.debug("🔌 STOMP Command = {}", command);

        try {
            // ✅ 1️⃣ CONNECT: 최초 연결 시 인증 및 Principal 등록
            if (StompCommand.CONNECT.equals(command)) {
                String token = (String) accessor.getSessionAttributes().get("ACCESS_TOKEN");
                if (token == null) {
                    log.warn("❌ CONNECT 토큰 없음 → 401");
                    throw new AccessDeniedException("401 Unauthorized");
                }

                if (!jwtService.validateToken(token)) {
                    log.warn("❌ CONNECT 토큰 검증 실패 → 401");
                    throw new AccessDeniedException("401 Unauthorized");
                }

                Long userId = jwtService.getUserIdFromToken(token); // ✅ 토큰에서 userId 추출
                accessor.setUser(new UsernamePasswordAuthenticationToken(
                        userId.toString(), null, Collections.emptyList()
                ));
                log.info("✅ [STOMP] CONNECT 인증 및 Principal 설정 완료 → userId={}", userId);
            }

            // ✅ 2️⃣ 알림 구독은 JWT 검사 생략 (Principal만 있으면 통과)
            if (StompCommand.SUBSCRIBE.equals(command)) {
                String destination = accessor.getDestination();
                if (destination != null && destination.startsWith("/user/queue/notifications")) {
                    log.debug("🔔 알림 구독 요청 감지 → JWT 검사 생략");
                    return message;
                }
            }

            // ✅ 3️⃣ SEND / 기타 SUBSCRIBE 시 인증된 세션인지 확인
            if ((StompCommand.SEND.equals(command) || StompCommand.SUBSCRIBE.equals(command))
                    && accessor.getUser() == null) {
                log.warn("❌ STOMP 세션에 Principal 없음 → 401");
                throw new AccessDeniedException("401 Unauthorized");
            }

        } catch (ExpiredJwtException e) {
            log.warn("❌ JWT 만료됨 → 401");
            throw new AccessDeniedException("401 Unauthorized");
        } catch (Exception e) {
            log.error("❌ STOMP 인증 처리 중 오류: {}", e.getMessage(), e);
            throw new AccessDeniedException("401 Unauthorized");
        }

        return message;
    }
}
