package com.sharestory.sharestory_backend.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryTrackingResponse {
    private String courier;
    private String trackingNumber;
    private String status;
    private LocalDateTime updatedAt;
    private List<TrackingHistoryDto> history;
}