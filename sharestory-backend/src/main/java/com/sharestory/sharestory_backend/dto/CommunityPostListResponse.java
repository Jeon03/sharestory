package com.sharestory.sharestory_backend.dto;
import lombok.*;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CommunityPostListResponse {
    private int count;
    private List<CommunityPostDto> posts;
}

