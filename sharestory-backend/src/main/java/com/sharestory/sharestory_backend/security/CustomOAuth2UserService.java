package com.sharestory.sharestory_backend.security;

import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User user = super.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attrs = user.getAttributes();
        OAuth2UserInfo info = OAuth2UserInfo.of(registrationId, attrs);

        // ✅ 이메일 / providerId 로 유저 찾기
        User entity = null;
        if (info.email() != null) {
            entity = userRepository.findByEmail(info.email()).orElse(null);
        }
        if (entity == null) {
            entity = userRepository.findByProviderAndProviderId(info.provider(), info.providerId())
                    .orElse(null);
        }

        // ✅ 없으면 신규 생성
        if (entity == null) {
            entity = User.builder()
                    .provider(info.provider())
                    .providerId(info.providerId())
                    .createdAt(Instant.now())
                    .role("ROLE_USER")
                    .points(100000)
                    .build();
        }

        // ✅ 공통 정보 업데이트
        if (info.email() != null) entity.setEmail(info.email());
        if (info.nickname() != null) entity.setNickname(info.nickname());
        entity.setLastLoginAt(Instant.now());
        userRepository.save(entity);

        // ✅ CustomUserDetails 반환 (OAuth2User + UserDetails 겸용)
        return new CustomUserDetails(entity, attrs);
    }
}

