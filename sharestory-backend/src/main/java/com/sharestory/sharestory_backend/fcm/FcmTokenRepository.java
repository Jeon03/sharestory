package com.sharestory.sharestory_backend.fcm; // ✅ 패키지 경로는 프로젝트에 맞게 조정하세요.

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FcmTokenRepository extends JpaRepository<FcmToken, Long> {

    // ✅ 사용자 ID로 FCM 토큰 목록을 조회합니다. (한 사용자가 여러 기기에서 로그인할 경우 대비)
    List<FcmToken> findByUserId(Long userId);

    // ✅ 사용자 ID로 FCM 토큰 단건을 조회합니다. (한 사용자가 하나의 토큰만 갖는 정책일 경우 사용)
    Optional<FcmToken> findFirstByUserId(Long userId);

    // ✅ 토큰 문자열 값으로 FCM 토큰을 조회합니다. (중복 저장 방지용)
    Optional<FcmToken> findByToken(String token);

}