package com.sharestory.sharestory_backend.domain;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ItemDoc {
    private String title;
    private String titleSuggest;
    private String titleNgram;
    private GeoPoint location;
    private Integer price;
    private LocalDateTime createdAt;

    @Getter @Setter
    public static class GeoPoint {
        private double lat;
        private double lon;
    }
}
