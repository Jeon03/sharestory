package com.sharestory.sharestory_backend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PostRequestDto {
    private String category;
    private String title;
    private String content;
}