package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.domain.PointHistory;
import com.sharestory.sharestory_backend.dto.PointHistoryDto;
import com.sharestory.sharestory_backend.service.PointHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/points")
@RequiredArgsConstructor
public class PointHistoryController {

    private final PointHistoryService pointHistoryService;

    @GetMapping("/history/{userId}")
    public List<PointHistoryDto> getHistory(@PathVariable Long userId) {
        return pointHistoryService.getUserPointHistory(userId)
                .stream()
                .map(PointHistoryDto::from)
                .toList();
    }
}
