package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.Order;
import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.dto.OrderStatus;
import com.sharestory.sharestory_backend.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationTemplateService {

    private final MailService mailService;
    private final UserRepository userRepository;

    public void sendSafeTradeMail(Order order, OrderStatus status) {

        Map<String, Object> vars = new HashMap<>();
        vars.put("itemTitle", order.getItem().getTitle());
        vars.put("courier", order.getDeliveryInfo().getCourier());
        vars.put("trackingNumber", order.getDeliveryInfo().getTrackingNumber());

        String buyerEmail = userRepository.findById(order.getBuyerId())
                .map(User::getEmail)
                .orElseThrow(() -> new IllegalArgumentException("구매자 정보 없음"));
        String sellerEmail = userRepository.findById(order.getSellerId())
                .map(User::getEmail)
                .orElseThrow(() -> new IllegalArgumentException("판매자 정보 없음"));

        String to;
        String subject;
        String template;

        switch (status) {
            case PENDING -> { // ✅ 결제 완료 → 판매자
                to = sellerEmail;
                subject = "[ShareStory] 구매자가 안전거래 결제를 완료했습니다";
                template = "payment_complete.html";
            }
            case SAFE_DELIVERY, SAFE_DELIVERY_START -> { // ✅ 송장 등록 / 배송 시작 → 구매자 + 판매자
                subject = "[ShareStory] 배송이 시작되었습니다";
                template = "delivery_start.html";
                mailService.sendMail(buyerEmail, subject, template, vars);
                mailService.sendMail(sellerEmail, subject, template, vars);
                return; // ✅ 두 명 모두 전송 후 종료
            }
            case SAFE_DELIVERY_COMPLETE -> { // ✅ 배송 완료 → 구매자 + 판매자
                subject = "[ShareStory] 물품이 배송 완료되었습니다";
                template = "delivery_complete.html";
                mailService.sendMail(buyerEmail, subject, template, vars);
                mailService.sendMail(sellerEmail, subject, template, vars);
                return;
            }
            case SAFE_DELIVERY_RECEIVED -> { // ✅ 수령 완료 → 판매자
                to = sellerEmail;
                subject = "[ShareStory] 거래가 완료되어 포인트가 지급됩니다";
                template = "receive_complete.html";
            }
            default -> { return; }
        }

        mailService.sendMail(to, subject, template, vars);
    }
}

