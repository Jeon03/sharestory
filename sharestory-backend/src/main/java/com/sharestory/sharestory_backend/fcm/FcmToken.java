package com.sharestory.sharestory_backend.fcm; // ✅ 패키지 경로는 프로젝트에 맞게 조정하세요.

import com.sharestory.sharestory_backend.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@EntityListeners(AuditingEntityListener.class) // ✅ Auditing 기능 활성화
@Table(name = "fcm_token") // ✅ 테이블 이름 명시
public class FcmToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255) // ✅ 토큰은 고유해야 하며 길이를 지정하는 것이 좋습니다.
    private String token;

    // ✅ User 엔티티와 다대일(N:1) 관계로 변경합니다.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false) // ✅ DB 컬럼명을 'user_id'로 지정
    private User user;

    @CreatedDate // ✅ 엔티티 생성 시 시간이 자동 저장됩니다.
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}