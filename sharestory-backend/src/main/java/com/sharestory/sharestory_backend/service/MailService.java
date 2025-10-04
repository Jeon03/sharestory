package com.sharestory.sharestory_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    public void sendMail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            message.setFrom("jeonyu2913@gmail.com");
            mailSender.send(message);

            System.out.println("메일 전송 성공 → " + to);
        } catch (Exception e) {
            System.err.println("메일 전송 실패: " + e.getMessage());
            e.printStackTrace();
        }
    }
}