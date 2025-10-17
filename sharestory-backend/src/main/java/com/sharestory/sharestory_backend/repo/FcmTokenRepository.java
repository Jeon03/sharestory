package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.FcmToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FcmTokenRepository extends JpaRepository<FcmToken, Long> {
    Optional<FcmToken> findByUserId(Long userId);
    void deleteByToken(String token);
}
