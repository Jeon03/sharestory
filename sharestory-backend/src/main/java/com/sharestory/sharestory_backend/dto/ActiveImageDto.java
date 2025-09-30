package com.sharestory.sharestory_backend.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ActiveImageDto {
    private Long id;
    private String imageUrl;
}