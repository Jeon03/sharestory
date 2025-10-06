// FcmTokenDto.java

package com.sharestory.sharestory_backend.dto; // 패키지 경로는 실제 위치에 맞게 확인하세요.

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
// FcmTokenDto.java

// ...
public class FcmTokenDto {
    private Long id;
    private String token;
    private Long userId;

    public FcmTokenDto(Long id, String token) {
        this.id = id;
        this.token = token;
    }

    // ---- [이 생성자를 추가하세요] ----
    public FcmTokenDto(Long id, String token, Long userId) {
        this.id = id;
        this.token = token;
        this.userId = userId;
    }
}