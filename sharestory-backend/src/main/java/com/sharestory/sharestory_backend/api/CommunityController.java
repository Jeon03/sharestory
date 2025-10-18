package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.dto.CommunityPostDto;
import com.sharestory.sharestory_backend.dto.CommunityPostListResponse;
import com.sharestory.sharestory_backend.repo.UserRepository;
import com.sharestory.sharestory_backend.security.CustomUserDetails;
import com.sharestory.sharestory_backend.service.CommunityService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
@Slf4j
@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;
    private final UserRepository userRepository;
    @PostMapping(
            value = "/write",
            consumes = { MediaType.MULTIPART_FORM_DATA_VALUE }
    )
    public ResponseEntity<?> createPost(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam("category") String category,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @RequestParam(value = "latitude", required = false) Double latitude,
            @RequestParam(value = "longitude", required = false) Double longitude,
            @RequestParam(value = "postLatitude", required = false) Double postLatitude,
            @RequestParam(value = "postLongitude", required = false) Double postLongitude,
            @RequestParam(value = "locationName", required = false) String locationName
    ) {
        // ✅ 로그인 확인
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("로그인이 필요합니다.");
        }

        User user = userDetails.getUser();

        // ✅ 게시글 생성
        CommunityPostDto saved = communityService.createPost(
                user,
                title,
                content,
                category,
                images,
                latitude,
                longitude,
                postLatitude,
                postLongitude,
                locationName
        );

        return ResponseEntity.ok(saved);
    }


    @GetMapping("/region")
    public ResponseEntity<CommunityPostListResponse> getPostsByRegion(
            @RequestParam(required = false) String region
    ) {
        log.info("🟠 요청된 지역 파라미터: {}", region);

        try {
            List<CommunityPostDto> posts = (region == null || region.isBlank())
                    ? communityService.getAllPosts()
                    : communityService.getPostsByRegion(region);

            CommunityPostListResponse response = CommunityPostListResponse.builder()
                    .count(posts.size())
                    .posts(posts)
                    .build();

            for (CommunityPostDto dto : response.getPosts()) {
                log.info(" - [{}] {} / {} / {}", dto.getId(), dto.getTitle(), dto.getAuthorName(), dto.getLocationName());
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 지역별 게시글 조회 중 오류 발생", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommunityPostDto> getPost(
            @PathVariable Long id,
            @RequestParam(required = false) Long userId,
            HttpServletRequest request) {

        // 요청자의 IP 주소
        String ipAddress = request.getRemoteAddr();

        // Redis 중복방지 + 조회수 증가 포함
        CommunityPostDto dto = communityService.getPost(id, userId, ipAddress);

        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        User user = userDetails.getUser();

        try {
            communityService.deletePost(id, user);
            return ResponseEntity.ok("게시글이 삭제되었습니다.");
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("작성자만 삭제할 수 있습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("삭제 중 오류가 발생했습니다.");
        }
    }

    /** ✅ 내가 쓴 글 */
    @GetMapping("/myposts")
    public ResponseEntity<?> getMyPosts(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        User user = userDetails.getUser();
        List<CommunityPostDto> posts = communityService.getPostsByUser(user);
        return ResponseEntity.ok(posts);
    }

    /** ✅ 내가 댓글 단 글 */
    @GetMapping("/mycomments")
    public ResponseEntity<?> getMyCommentedPosts(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        User user = userDetails.getUser();
        List<CommunityPostDto> posts = communityService.getPostsByUserComments(user);
        return ResponseEntity.ok(posts);
    }

    /** ✅ 내가 좋아요 누른 글 */
    @GetMapping("/mylikes")
    public ResponseEntity<?> getMyLikedPosts(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        User user = userDetails.getUser();
        List<CommunityPostDto> posts = communityService.getPostsByUserLikes(user);
        return ResponseEntity.ok(posts);
    }


}
