// 경로: src/main/java/com/sharestory/sharestory_backend/domain/BaseTimeEntity.java
package com.sharestory.sharestory_backend.domain;

import jakarta.persistence.Column; // import 추가
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@MappedSuperclass // JPA 엔티티 클래스들이 이 클래스를 상속할 경우 필드들도 칼럼으로 인식하도록 합니다.
@EntityListeners(AuditingEntityListener.class) // Auditing 기능을 포함시킵니다.
public abstract class BaseTimeEntity {

    @CreatedDate // 엔티티가 생성되어 저장될 때 시간이 자동 저장됩니다.
    @Column(name = "created_date", updatable = false) // ✅ DB의 'created_date' 컬럼과 매핑, 업데이트 불가 설정
    private LocalDateTime createdAt;

    @LastModifiedDate // 조회한 엔티티의 값을 변경할 때 시간이 자동 저장됩니다.
    @Column(name = "updated_date") // ✅ DB의 'updated_date' 컬럼과 매핑
    private LocalDateTime updatedAt;
}