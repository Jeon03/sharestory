package com.sharestory.sharestory_backend.security;

import com.sharestory.sharestory_backend.domain.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

@Getter
public class CustomUserDetails implements UserDetails, OAuth2User {

    private final Long id;
    private final String email;
    private final String nickname;
    private final String role;
    private final String provider;
    private final String providerId;

    private final Map<String, Object> attributes; // ✅ OAuth2User용

    // User 엔티티 기반 생성자
    public CustomUserDetails(User user) {
        this(user, Map.of(
                "userId", user.getId(),
                "role", user.getRole(),
                "nickname", user.getNickname()
        ));
    }

    // OAuth2User 기반 생성자
    public CustomUserDetails(User user, Map<String, Object> attributes) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.nickname = user.getNickname();
        this.role = user.getRole();
        this.provider = user.getProvider();
        this.providerId = user.getProviderId();
        this.attributes = attributes != null ? attributes : Collections.emptyMap();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singleton((GrantedAuthority) () -> role);
    }

    @Override
    public String getUsername() {
        return email != null ? email : provider + "_" + providerId;
    }

    // 소셜 로그인은 비밀번호 불필요 → 빈 문자열 반환
    @Override
    public String getPassword() {
        return "";
    }

    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }

    // ✅ OAuth2User 메서드 구현
    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public String getName() {
        return String.valueOf(id);
    }

    @Override
    public String toString() {
        return "CustomUserDetails{" +
                "id=" + id +
                ", email='" + email + '\'' +
                ", nickname='" + nickname + '\'' +
                ", role='" + role + '\'' +
                '}';
    }
}
