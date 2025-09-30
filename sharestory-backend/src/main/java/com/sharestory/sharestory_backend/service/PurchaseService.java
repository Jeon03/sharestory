package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.Item;
import com.sharestory.sharestory_backend.domain.User;
//import com.sharestory.sharestory_backend.email.EmailService;
import com.sharestory.sharestory_backend.fcm.FcmTokenRepository;
import com.sharestory.sharestory_backend.fcm.FirebaseService;
import com.sharestory.sharestory_backend.repo.ItemRepository;
import com.sharestory.sharestory_backend.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
public class PurchaseService {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository; // ✅ UserRepository 주입
   // private final EmailService emailService;
    private final FirebaseService firebaseService;
    private final FcmTokenRepository fcmTokenRepository;

    public void notifySeller(Long itemId, String buyerUsername) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NoSuchElementException("상품을 찾을 수 없습니다: " + itemId));

        // ✅ 1. Item에서 sellerId를 가져옵니다.
        Long sellerId = item.getUserId();// 또는 item.getUserId()
        if (sellerId == null) {
            log.error("상품에 판매자 ID 정보가 없습니다. (상품 ID: {})", itemId);
            return;
        }

        // ✅ 2. sellerId를 이용해 UserRepository에서 User(판매자) 정보를 조회합니다.
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new NoSuchElementException("판매자를 찾을 수 없습니다: " + sellerId));

        String title = "새로운 구매 요청 도착! 🚀";
        String message = buyerUsername + "님이 '" + item.getTitle() + "' 상품을 구매하고 싶어해요.";

        boolean hasFcmToken = !fcmTokenRepository.findByUserId(seller.getId()).isEmpty();

        if (hasFcmToken) {
            log.info("판매자(ID:{})에게 푸시 알림을 전송합니다.", seller.getId());
            firebaseService.sendPushNotificationToUser(seller.getId(), title, message);
        }/* else {
            log.info("판매자(ID:{})에게 이메일 알림을 전송합니다. (FCM 토큰 없음)", seller.getId());
            emailService.sendSimpleMessage(seller.getEmail(), title, message);
        }*/
    }
}