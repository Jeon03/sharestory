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

        // ✅ 안전하게 아이템 제목 가져오기 (일반 or 경매)
        String itemTitle = "(제목 없음)";
        try {
            if (order.getItem() != null && order.getItem().getTitle() != null) {
                itemTitle = order.getItem().getTitle();
            } else if (order.getAuctionItem() != null && order.getAuctionItem().getTitle() != null) {
                itemTitle = order.getAuctionItem().getTitle() + " (경매)";
            }
        } catch (Exception e) {
            itemTitle = "(제목 불러오기 오류)";
        }

        // ✅ 템플릿 변수 구성
        Map<String, Object> vars = new HashMap<>();
        vars.put("itemTitle", itemTitle);
        if (order.getDeliveryInfo() != null) {
            vars.put("courier", order.getDeliveryInfo().getCourier());
            vars.put("trackingNumber", order.getDeliveryInfo().getTrackingNumber());
        } else {
            vars.put("courier", "-");
            vars.put("trackingNumber", "-");
        }

        // ✅ 구매자 / 판매자 이메일 조회
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

            // ✅ 결제 완료 → 판매자
            case PENDING -> {
                to = sellerEmail;
                subject = "[ShareStory] 구매자가 안전거래 결제를 완료했습니다";
                template = "payment_complete.html";
                mailService.sendMail(to, subject, template, vars);
            }

            // ✅ 배송 시작 (SAFE_DELIVERY, SAFE_DELIVERY_START) → 구매자 + 판매자
            case SAFE_DELIVERY, SAFE_DELIVERY_START -> {
                subject = "[ShareStory] 배송이 시작되었습니다";
                template = "delivery_start.html";
                mailService.sendMail(buyerEmail, subject, template, vars);
                mailService.sendMail(sellerEmail, subject, template, vars);
            }

            // ✅ 배송 완료 → 구매자 + 판매자
            case SAFE_DELIVERY_COMPLETE -> {
                subject = "[ShareStory] 물품이 배송 완료되었습니다";
                template = "delivery_complete.html";
                mailService.sendMail(buyerEmail, subject, template, vars);
                mailService.sendMail(sellerEmail, subject, template, vars);
            }

            // ✅ 구매자 수령 완료 → 판매자
            case SAFE_DELIVERY_RECEIVED -> {
                to = sellerEmail;
                subject = "[ShareStory] 거래가 완료되어 포인트가 지급됩니다";
                template = "receive_complete.html";
                mailService.sendMail(to, subject, template, vars);
            }

            default -> {
                // 처리하지 않는 상태는 무시
            }
        }
    }
}
