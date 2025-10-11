package com.sharestory.sharestory_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {



    private final StompAuthInterceptor stompAuthInterceptor;
    private final HttpHandshakeInterceptor httpHandshakeInterceptor;

    public WebSocketConfig(StompAuthInterceptor stompAuthInterceptor,
                           HttpHandshakeInterceptor httpHandshakeInterceptor) {
        this.stompAuthInterceptor = stompAuthInterceptor;
        this.httpHandshakeInterceptor = httpHandshakeInterceptor;
    }

    // 클라이언트에서 연결할 엔드포인트
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-connect")
                .addInterceptors(httpHandshakeInterceptor)
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    // pub/sub 설정
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/pub");
        registry.enableSimpleBroker("/sub", "/queue");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // ✅ 모든 STOMP 메시지(SEND, SUBSCRIBE 등)에 대해 JWT 검사 실행
        registration.interceptors(stompAuthInterceptor);
    }
}