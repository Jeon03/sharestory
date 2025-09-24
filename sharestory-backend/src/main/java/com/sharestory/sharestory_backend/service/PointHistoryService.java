package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.PointHistory;
import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.repo.PointHistoryRepository;
import com.sharestory.sharestory_backend.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PointHistoryService {

    private final PointHistoryRepository pointHistoryRepository;
    private final UserRepository userRepository;

    // 유저 포인트 내역 조회
    public List<PointHistory> getUserPointHistory(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 유저가 존재하지 않습니다."));
        return pointHistoryRepository.findByUserOrderByCreatedAtDesc(user);
    }

    // 포인트 기록 추가 (충전/사용/환불 등)
    public PointHistory addHistory(User user, int amount, int newBalance, String type, String description) {
        PointHistory history = PointHistory.builder()
                .user(user)
                .amount(amount)
                .balance(newBalance)
                .type(type)
                .description(description)
                .build();
        return pointHistoryRepository.save(history);
    }
}
