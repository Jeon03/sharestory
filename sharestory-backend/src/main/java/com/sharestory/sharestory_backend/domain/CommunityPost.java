package com.sharestory.sharestory_backend.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunityPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> imageUrls = new ArrayList<>();

    //[검색용 좌표] — 사용자의 기본 지역 (User.myLatitude, myLongitude 기준)
    private Double latitude;
    private Double longitude;

    //[공유용 좌표] — 게시글 작성 시 지도에서 선택한 실제 위치
    private Double postLatitude;
    private Double postLongitude;

    private String locationName; // ex. "서울 은평구 역촌동"

    @ManyToOne(fetch = FetchType.LAZY)
    private User author;

    private int likeCount = 0;
    private int viewCount = 0;

    private String category;

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "post",
            cascade = CascadeType.ALL,
            orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();
}
