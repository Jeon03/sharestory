// PointService.java
package com.sharestory.sharestory_backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sharestory.sharestory_backend.domain.PointHistory;
import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.dto.PointChargeRequest;
import com.sharestory.sharestory_backend.repo.PointHistoryRepository;
import com.sharestory.sharestory_backend.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PointService {

    private final UserRepository userRepository;
    private final PointHistoryRepository historyRepository;
    @Value("${iamport.api.key}")
    private String iamportApiKey;

    @Value("${iamport.api.secret}")
    private String iamportApiSecret;

    @Transactional
    public int verifyAndCharge(Long userId, PointChargeRequest request) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            // 1. AccessToken 발급 요청
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ObjectMapper mapper = new ObjectMapper();
            String jsonBody = mapper.writeValueAsString(Map.of(
                    "imp_key", iamportApiKey,
                    "imp_secret", iamportApiSecret
            ));

            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<Map> tokenResponse = restTemplate.exchange(
                    "https://api.iamport.kr/users/getToken",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            Map<String, Object> body = tokenResponse.getBody();
            if (body == null || body.get("response") == null) {
                throw new IllegalStateException("아임포트 토큰 응답 실패: " + body);
            }

            Map<String, Object> response = (Map<String, Object>) body.get("response");
            String accessToken = (String) response.get("access_token");

            log.info(">>> IAMPORT ACCESS TOKEN = {}", accessToken);

            // 2. 결제 내역 조회
            HttpHeaders authHeaders = new HttpHeaders();
            authHeaders.setBearerAuth(accessToken);
            HttpEntity<Void> authEntity = new HttpEntity<>(authHeaders);

            ResponseEntity<Map> paymentResponse = restTemplate.exchange(
                    "https://api.iamport.kr/payments/" + request.getImpUid(),
                    HttpMethod.GET,
                    authEntity,
                    Map.class
            );

            Map<String, Object> paymentBody = paymentResponse.getBody();
            Map<String, Object> paymentData = (Map<String, Object>) paymentBody.get("response");

            int paidAmount = ((Number) paymentData.get("amount")).intValue();
            if (paidAmount != request.getAmount()) {
                throw new IllegalStateException("결제 금액 불일치");
            }

            // 3. 포인트 적립
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));
            int newBalance = user.getPoints() + paidAmount;
            user.setPoints(newBalance);

            PointHistory history = PointHistory.builder()
                    .user(user)
                    .amount(paidAmount)
                    .balance(newBalance)
                    .type("CHARGE")
                    .description("아임포트 포인트 충전")
                    .build();

            historyRepository.save(history);
            userRepository.save(user);

            return newBalance;

        } catch (JsonProcessingException e) {
            throw new RuntimeException("아임포트 요청 JSON 직렬화 실패", e);
        }
    }

    public int getUserPoints(Long userId) {
        return userRepository.findById(userId)
                .map(User::getPoints)
                .orElse(0);
    }

    public List<PointHistory> getHistory(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));
        return historyRepository.findByUserOrderByCreatedAtDesc(user);
    }

    @Transactional
    public void payAuctionSafeTrade(Long buyerId, int amount) {
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));

        if (buyer.getPoints() < amount) {
            throw new IllegalStateException("포인트가 부족합니다.");
        }

        buyer.setPoints(buyer.getPoints() - amount);

        historyRepository.save(PointHistory.builder()
                .user(buyer)
                .amount(-amount)
                .type("AUCTION_SAFE_PAYMENT")
                .description("경매 안전거래 결제 (배송비 + 수수료)")
                .createdAt(Instant.now())
                .build());
    }
}
