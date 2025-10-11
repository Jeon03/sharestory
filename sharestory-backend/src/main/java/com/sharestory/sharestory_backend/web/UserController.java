package com.sharestory.sharestory_backend.web;

import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.dto.LocationUpdateRequestDto; // ✅ DTO를 LocationUpdateRequestDto로 통일
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import com.sharestory.sharestory_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // 로그인된 사용자 정보 조회 (위치 포함)
    @GetMapping("/main")
    public Map<String, Object> me(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return Map.of("authenticated", false);
        }
        try {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            User user = userService.getUserById(userDetails.getId());

            Map<String, Object> result = new HashMap<>();
            result.put("id", user.getId());
            result.put("email", user.getEmail());
            result.put("nickname", user.getNickname());
            result.put("role", user.getRole());
            result.put("myLatitude", user.getMyLatitude());
            result.put("myLongitude", user.getMyLongitude());
            result.put("addressName", user.getAddressName());
            result.put("points", user.getPoints());
            result.put("authenticated", true);
            return result;
        } catch (Exception e) {
            return Map.of("authenticated", false, "error", e.getMessage());
        }
    }

    // ✅ [수정된 부분] 위치 업데이트 API
    @PutMapping("/users/location")
    public ResponseEntity<Map<String, Object>> updateUserLocation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            // DTO를 LocationUpdateRequestDto로 변경하여 UserService와 일치시킴
            @RequestBody LocationUpdateRequestDto dto
    ) {
        // ✅ [핵심] userRepository를 직접 사용하는 대신, UserService의 메소드를 호출합니다.
        userService.updateUserLocation(userDetails.getId(), dto);

        // 성공 응답을 Map 객체(JSON)로 반환합니다.
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "사용자 위치 정보가 업데이트되었습니다.");

        return ResponseEntity.ok(response);
    }
}