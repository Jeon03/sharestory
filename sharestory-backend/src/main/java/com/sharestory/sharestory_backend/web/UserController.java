package com.sharestory.sharestory_backend.web;

import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.dto.LocationUpdateRequest;
import com.sharestory.sharestory_backend.repo.UserRepository;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    // 로그인된 사용자 정보 조회 (변경 없음)
    @GetMapping("/main")
    public Map<String, Object> me(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return Map.of("authenticated", false);
        }
        try {
            CustomUserDetails user = (CustomUserDetails) authentication.getPrincipal();
            User u = userRepository.findById(user.getId()).orElseThrow();

            Map<String, Object> result = new HashMap<>();
            result.put("id", user.getId());
            result.put("email", user.getEmail());
            result.put("nickname", user.getNickname());
            result.put("role", user.getRole());
            result.put("myLatitude", u.getMyLatitude());
            result.put("myLongitude", u.getMyLongitude());
            result.put("addressName", u.getAddressName());
            result.put("points", u.getPoints());
            result.put("authenticated", true);

            return result;
        } catch (Exception e) {
            return Map.of("authenticated", false, "error", e.getMessage());
        }
    }

    // ✅ [최종본] 이 메소드 하나만 남겨서 위치 업데이트를 처리합니다.
    @PutMapping("/users/location")
    public Map<String, Object> updateLocation(
            @RequestBody LocationUpdateRequest request,
            Authentication authentication
    ) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return Map.of("success", false, "message", "로그인이 필요합니다.");
        }
        try {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            User user = userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            user.setMyLatitude(request.getMyLatitude());
            user.setMyLongitude(request.getMyLongitude());
            user.setAddressName(request.getAddressName());

            userRepository.save(user);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "위치가 업데이트되었습니다.");
            return result;
        } catch (Exception e) {
            return Map.of("success", false, "message", e.getMessage());
        }
    }
}