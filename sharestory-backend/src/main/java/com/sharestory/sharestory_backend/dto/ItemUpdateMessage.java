package com.sharestory.sharestory_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ItemUpdateMessage {
    private Long roomId;
    private Long itemId;
    private String title;
    private int price;
    private String imageUrl;
    private String description;
}
