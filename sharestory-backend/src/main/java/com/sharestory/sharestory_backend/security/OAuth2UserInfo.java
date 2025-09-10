package com.sharestory.sharestory_backend.security;

import java.util.Map;

public record OAuth2UserInfo(String provider, String providerId, String email, String nickname) {
    public static OAuth2UserInfo of(String registrationId, Map<String, Object> attributes) {
        switch (registrationId) {
            case "google" -> {
                String id = (String) attributes.get("sub");
                String email = (String) attributes.get("email");
                String name = (String) attributes.get("name");
                return new OAuth2UserInfo("google", id, email, name);
            }
            case "kakao" -> {
                // kakao: { id, kakao_account{ email }, properties{ nickname } }
                String id = String.valueOf(attributes.get("id"));
                Map<String, Object> account = (Map<String, Object>) attributes.get("kakao_account");
                Map<String, Object> props = (Map<String, Object>) attributes.get("properties");
                String email = account != null ? (String) account.get("email") : null;
                String nick = props != null ? (String) props.get("nickname") : null;
                return new OAuth2UserInfo("kakao", id, email, nick);
            }
            case "naver" -> {
                // naver: { resultcode, message, response{ id, email, name } }
                Map<String, Object> resp = (Map<String, Object>) attributes.get("response");
                String id = resp != null ? (String) resp.get("id") : null;
                String email = resp != null ? (String) resp.get("email") : null;
                String name = resp != null ? (String) resp.get("name") : null;
                return new OAuth2UserInfo("naver", id, email, name);
            }
            default -> throw new IllegalArgumentException("Unsupported provider " + registrationId);
        }
    }
}