package com.sharestory.sharestory_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.repo.UserRepository;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuctionItemResponseDto {

    private Long id;
    private String title;
    private String category;
    private String conditionType;
    private int startPrice;
    private Integer currentPrice;
    private Integer bidUnit;
    private Integer immediatePrice;
    private Integer bidCount;
    private String description;
    private String mainImageUrl;
    private String sellerNickname;
    private String createdAt;
    private String endDateTime;
    private String status;
    private String paymentDeadline;
    // 민감 정보
    private Long winnerId;
    private Integer winningPrice;

    // 사용자별 권한 플래그
    @JsonProperty("seller")
    private boolean isSeller;

    @JsonProperty("buyer")
    private boolean isBuyer;

    @JsonProperty("canViewTrade")
    private boolean canViewTrade;

    // ✅ 판매자 닉네임 포함 버전
    public static AuctionItemResponseDto from(AuctionItem item, Long currentUserId, UserRepository userRepository) {
        boolean isSeller = currentUserId != null && item.getSellerId() != null
                && item.getSellerId().equals(currentUserId);
        boolean isBuyer = currentUserId != null && item.getWinnerId() != null
                && item.getWinnerId().equals(currentUserId);
        boolean canViewTrade = isSeller || isBuyer;

        String sellerNickname;
        if (item.getSellerId() != null) {
            sellerNickname = userRepository.findById(item.getSellerId())
                    .map(User::getNickname)
                    .orElse("탈퇴한 사용자");
        } else {
            sellerNickname = "알 수 없음";
        }

        AuctionItemResponseDtoBuilder b = AuctionItemResponseDto.builder()
                .id(item.getId())
                .title(item.getTitle())
                .category(item.getCategory())
                .conditionType(item.getConditionType())
                .startPrice(item.getStartPrice())
                .currentPrice(item.getCurrentPrice())
                .bidUnit(item.getBidUnit())
                .immediatePrice(item.getImmediatePrice())
                .bidCount(item.getBidCount())
                .description(item.getDescription())
                .mainImageUrl(item.getMainImageUrl())
                .sellerNickname(sellerNickname)
                .createdAt(item.getCreatedAt() != null ? item.getCreatedAt().toString() : null)
                .endDateTime(item.getEndDateTime() != null ? item.getEndDateTime().toString() : null)
                .status(item.getStatus() != null ? item.getStatus().name() : null)
                .canViewTrade(canViewTrade)
                .paymentDeadline(item.getPaymentDeadline() != null ? item.getPaymentDeadline().toString() : null)
                .isSeller(isSeller)
                .isBuyer(isBuyer);

        // 🔒 판매자/낙찰자에게만 민감 정보 노출
        if (canViewTrade) {
            b.winnerId(item.getWinnerId());
            b.winningPrice(item.getWinningPrice());
        }

        return b.build();
    }

    // ✅ 간단 버전 (userRepository 불필요)
    public static AuctionItemResponseDto from(AuctionItem item, Long currentUserId) {
        boolean isSeller = currentUserId != null && item.getSellerId() != null
                && item.getSellerId().equals(currentUserId);
        boolean isBuyer = currentUserId != null && item.getWinnerId() != null
                && item.getWinnerId().equals(currentUserId);
        boolean canViewTrade = isSeller || isBuyer;

        return AuctionItemResponseDto.builder()
                .id(item.getId())
                .title(item.getTitle())
                .category(item.getCategory())
                .conditionType(item.getConditionType())
                .startPrice(item.getStartPrice())
                .currentPrice(item.getCurrentPrice())
                .bidUnit(item.getBidUnit())
                .immediatePrice(item.getImmediatePrice())
                .bidCount(item.getBidCount())
                .description(item.getDescription())
                .mainImageUrl(item.getMainImageUrl())
                .sellerNickname("알 수 없음")
                .createdAt(item.getCreatedAt() != null ? item.getCreatedAt().toString() : null)
                .endDateTime(item.getEndDateTime() != null ? item.getEndDateTime().toString() : null)
                .status(item.getStatus() != null ? item.getStatus().name() : null)
                .canViewTrade(canViewTrade)
                .paymentDeadline(item.getPaymentDeadline() != null ? item.getPaymentDeadline().toString() : null)
                .isSeller(isSeller)
                .isBuyer(isBuyer)
                .winnerId(canViewTrade ? item.getWinnerId() : null)
                .winningPrice(canViewTrade ? item.getWinningPrice() : null)
                .build();
    }
    // 🧩 Entity → DTO 변환
    public static AuctionItemResponseDto from(AuctionItem item) {
        return AuctionItemResponseDto.builder()
                .id(item.getId())
                .title(item.getTitle())
                .category(item.getCategory())
                .conditionType(item.getConditionType())
                .startPrice(item.getStartPrice())
                .currentPrice(item.getCurrentPrice())
                .bidUnit(item.getBidUnit())
                .immediatePrice(item.getImmediatePrice())
                .bidCount(item.getBidCount())
                .description(item.getDescription())
                .mainImageUrl(item.getMainImageUrl())
                .createdAt(item.getCreatedAt().toString())
                .endDateTime(item.getEndDateTime().toString())
                .status(item.getStatus().toString())
                .winnerId(item.getWinnerId())
                .winningPrice(item.getWinningPrice())
                .isSeller(false)
                .isBuyer(false)
                .canViewTrade(false)
                .paymentDeadline(item.getPaymentDeadline() != null ? item.getPaymentDeadline().toString() : null)
                .build();
    }
}
