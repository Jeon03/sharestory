package com.sharestory.sharestory_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserMainResponse {
    private boolean authenticated;
    private Long id;
    private String email;
    private String nickname;
    private String role;
    private Double myLatitude;
    private Double myLongitude;
    private String addressName;
}
