package com.sharestory.sharestory_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LocationUpdateRequest {
    private String addressName;
    private Double myLatitude;
    private Double myLongitude;
}
