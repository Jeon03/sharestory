package com.sharestory.sharestory_backend.web;

import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.repo.UserRepository;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;

    // 로그인된 사용자 정보 조회
    @GetMapping("/main")
    public Map<String, ?> me(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return Map.of("authenticated", false);
        }

        try {
            CustomUserDetails user = (CustomUserDetails) authentication.getPrincipal();
            return Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "nickname", user.getNickname(),
                    "role", user.getRole(),
                    "authenticated", true
            );
        } catch (Exception e) {
            return Map.of("authenticated", false, "error", e.getMessage());
        }
    }
}
