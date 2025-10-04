package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.service.MailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/mail")
public class MailController {

    private final MailService mailService;

    @PostMapping("/send")
    public ResponseEntity<String> sendTestMail(@RequestParam String to) {
        mailService.sendMail(to, "ShareStory 메일 테스트", "안녕하세요! JavaMailSender 테스트 메일입니다. 🚀");
        return ResponseEntity.ok("메일 전송 완료");
    }
}