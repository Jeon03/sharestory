package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.fcm.SseService; // 이전에 만드신 SseService 경로
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/sse")
@RequiredArgsConstructor
public class SseController {

    private final SseService sseService;

    /**
     * 클라이언트가 SSE 연결을 요청하는 엔드포인트
     */
    @GetMapping(value = "/connect", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter connect(@AuthenticationPrincipal CustomUserDetails user) {
        if (user == null) {
            // 비로그인 사용자는 연결을 거부하거나, 별도의 처리를 할 수 있습니다.
            // 여기서는 간단히 예외를 발생시키지만, 실제로는 다르게 처리할 수 있습니다.
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
        return sseService.connect(user.getId());
    }
}