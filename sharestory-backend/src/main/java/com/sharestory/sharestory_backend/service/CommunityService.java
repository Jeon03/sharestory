package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.CommunityPost;
import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.dto.CommunityPostDto;
import com.sharestory.sharestory_backend.repo.CommunityPostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CommunityService {

    private final CommunityPostRepository repo;
    private final S3Service s3Service;
    private final CommunityPostRepository communityPostRepository;

    public CommunityPostDto createPost(User user, String title, String content,String category,
                                       List<MultipartFile> images,
                                       Double latitude, Double longitude,
                                       Double postLatitude, Double postLongitude,
                                       String locationName) {

        if (user.getMyLatitude() == null || user.getMyLongitude() == null || user.getAddressName() == null) {
            throw new IllegalStateException("게시글을 등록하려면 먼저 내 동네를 설정해야 합니다.");
        }

        // ✅ 이미지 업로드
        List<String> imageUrls = new ArrayList<>();
        if (images != null && !images.isEmpty()) {
            for (MultipartFile image : images) {
                try {
                    imageUrls.add(s3Service.uploadFile(image, "community"));
                } catch (IOException e) {
                    log.error("❌ 이미지 업로드 실패: {}", e.getMessage(), e);
                }
            }
        }

        // ✅ 검색용 위치
        Double finalLat = (latitude != null) ? latitude : user.getMyLatitude();
        Double finalLon = (longitude != null) ? longitude : user.getMyLongitude();

        // ✅ 공유 위치 (선택)
        Double finalPostLat = (postLatitude != null) ? postLatitude : null;
        Double finalPostLon = (postLongitude != null) ? postLongitude : null;

        // ✅ 위치명 (공유한 위치면 그 주소, 아니면 사용자 주소)
        String finalLoc = (locationName != null && !locationName.isBlank())
                ? locationName
                : user.getAddressName();

        // ✅ 엔티티 생성
        CommunityPost post = CommunityPost.builder()
                .author(user)
                .title(title)
                .content(content)
                .category(category)
                .imageUrls(imageUrls)
                .latitude(finalLat)
                .longitude(finalLon)
                .postLatitude(finalPostLat)
                .postLongitude(finalPostLon)
                .locationName(finalLoc)
                .createdAt(LocalDateTime.now())
                .build();

        repo.save(post);

        log.info("✅ 커뮤니티 게시글 등록 완료 - 작성자: {}, 공유위치: {}",
                user.getNickname(),
                (finalPostLat != null ? "위치공유됨" : "공유안함"));

        return CommunityPostDto.from(post);
    }

    // ✅ 지역별 게시글 조회 (DTO 변환 포함)
    @Transactional(readOnly = true)
    public List<CommunityPostDto> getPostsByRegion(String region) {
        List<CommunityPost> posts = repo.findByLocationNameContainingIgnoreCase(region);
        return posts.stream()
                .map(CommunityPostDto::from)
                .toList();
    }

    // ✅ 전체 게시글 조회 (DTO 변환 포함)
    @Transactional(readOnly = true)
    public List<CommunityPostDto> getAllPosts() {
        List<CommunityPost> posts = repo.findAll();
        return posts.stream()
                .map(CommunityPostDto::from)
                .toList();
    }

    /** 🔍 상세 조회 (조회수 증가) */
    public CommunityPostDto getPost(Long id) {
        CommunityPost post = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 게시글이 존재하지 않습니다."));
        post.setViewCount(post.getViewCount() + 1);
        repo.save(post);
        return CommunityPostDto.from(post);
    }

    @Transactional
    public void deletePost(Long postId, User currentUser) {
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다."));

        // ✅ 작성자 본인만 삭제 가능
        if (!post.getAuthor().getId().equals(currentUser.getId())) {
            throw new SecurityException("본인 게시글만 삭제할 수 있습니다.");
        }

        // ✅ S3 이미지 삭제
        if (post.getImageUrls() != null && !post.getImageUrls().isEmpty()) {
            for (String imageUrl : post.getImageUrls()) {
                try {
                    s3Service.deleteFile(imageUrl);
                } catch (Exception e) {
                    log.warn("⚠️ 이미지 삭제 실패: {}", imageUrl, e);
                }
            }
        }

        // ✅ 게시글 삭제
        communityPostRepository.delete(post);

        log.info("🗑️ 게시글 및 관련 이미지 삭제 완료 (id: {})", postId);
    }
}
