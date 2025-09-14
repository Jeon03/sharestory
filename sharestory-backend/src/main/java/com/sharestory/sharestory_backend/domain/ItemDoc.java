package com.sharestory.sharestory_backend.domain;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ItemDoc {
    private Long id;

    private String title;
    private String titleSuggest;
    private String titleNgram;
    private GeoPoint location;
    private Integer price;
    private String createdAt;
    private String updatedAt;

    @Getter @Setter
    public static class GeoPoint {
        private double lat;
        private double lon;
    }

    private String imageUrl;
    private String itemStatus;
    private Integer favoriteCount;
    private Integer viewCount;
    private Integer chatRoomCount;
}
