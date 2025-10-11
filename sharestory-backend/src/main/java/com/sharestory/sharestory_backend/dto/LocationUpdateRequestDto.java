package com.sharestory.sharestory_backend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class LocationUpdateRequestDto {
    private Double latitude;
    private Double longitude;
    private String addressName;
}