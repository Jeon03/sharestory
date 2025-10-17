package com.sharestory.sharestory_backend.dto;

import com.sharestory.sharestory_backend.domain.CommunityPost;
import com.sharestory.sharestory_backend.domain.User;
import lombok.*;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Getter
@Builder
public class CommunityPostDto {
    private Long id;
    private String title;
    private String content;
    private List<String> imageUrls;
    private String category;
    private Double latitude;
    private Double longitude;
    private Double postLatitude;
    private Double postLongitude;

    private String locationName;

    private String authorName;
    private String authorEmail;
    private int likeCount;
    private int viewCount;
    private String createdAt;


    public static CommunityPostDto from(CommunityPost post) {
        User author = post.getAuthor();

        return CommunityPostDto.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .category(post.getCategory())
                .imageUrls(post.getImageUrls() != null
                        ? new ArrayList<>(post.getImageUrls())
                        : List.of())
                .latitude(post.getLatitude())
                .longitude(post.getLongitude())
                .postLatitude(post.getPostLatitude())
                .postLongitude(post.getPostLongitude())
                .locationName(post.getLocationName())
                .likeCount(post.getLikeCount())
                .viewCount(post.getViewCount())
                .authorName(author != null ? author.getNickname() : "익명")
                .authorEmail(author != null ? author.getEmail() : null)
                .createdAt(post.getCreatedAt() != null
                        ? post.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                        : null)
                .build();
    }
}

