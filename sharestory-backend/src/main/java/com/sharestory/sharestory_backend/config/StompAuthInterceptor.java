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
import org.springframework.stereotype.Component;

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

        if (accessor != null) {
            log.debug("🔌 STOMP Command = {}", accessor.getCommand());

            if (StompCommand.SEND.equals(accessor.getCommand()) ||
                    StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {

                String token = (String) accessor.getSessionAttributes().get("ACCESS_TOKEN");

                if (token == null) {
                    log.warn("❌ 토큰 없음 → 401");
                    throw new AccessDeniedException("401 Unauthorized");
                }

                try {
                    boolean valid = jwtService.validateToken(token);
                    if (!valid) {
                        throw new AccessDeniedException("401 Unauthorized");
                    }
                } catch (ExpiredJwtException e) {
                    throw new AccessDeniedException("401 Unauthorized");
                }
            }
        }
        return message;
    }
}

