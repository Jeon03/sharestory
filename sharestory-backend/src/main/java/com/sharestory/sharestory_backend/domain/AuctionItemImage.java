package com.sharestory.sharestory_backend.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "auction_item_image") // 테이블 이름도 분리
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuctionItemImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String url;

    private Integer sortOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_item_id") // 참조하는 외래 키 변경
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private AuctionItem auctionItem; // ♻️ Item -> AuctionItem 으로 변경
}