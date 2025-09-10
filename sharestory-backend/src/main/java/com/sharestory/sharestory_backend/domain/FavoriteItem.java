package com.sharestory.sharestory_backend.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.*;

@Builder
@Entity
@Getter
@Setter   // <= 이거 추가
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteItem {
    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne
    private User user;

    @ManyToOne
    private Item item;
}
