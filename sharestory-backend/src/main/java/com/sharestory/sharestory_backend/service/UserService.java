package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.dto.LocationUpdateRequestDto;
import com.sharestory.sharestory_backend.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;

    /**
     * ✅ [추가] 사용자 상세 정보 조회 로직
     * 기존 UserController의 me() 메소드 로직을 가져왔습니다.
     */
    @Transactional(readOnly = true)
    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. ID: " + userId));
    }

    /**
     * ✅ [기존] 사용자 위치 정보 업데이트 로직
     */
    public User updateUserLocation(Long userId, LocationUpdateRequestDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. ID: " + userId));

        user.setMyLatitude(dto.getLatitude());
        user.setMyLongitude(dto.getLongitude());
        user.setAddressName(dto.getAddressName());

        return userRepository.save(user);
    }
}