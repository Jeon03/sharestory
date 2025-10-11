package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.CommunityComment; // ✅ 추가: CommunityComment 클래스 import
import com.sharestory.sharestory_backend.domain.CommunityPost;
import com.sharestory.sharestory_backend.domain.PostLike;
import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.dto.CommentRequestDto; // ✅ 추가: CommentRequestDto 클래스 import
import com.sharestory.sharestory_backend.dto.CommentResponseDto; // ✅ 추가: CommentResponseDto 클래스 import
import com.sharestory.sharestory_backend.dto.PostRequestDto;
import com.sharestory.sharestory_backend.dto.PostResponseDto;
import com.sharestory.sharestory_backend.repo.CommunityCommentRepository;
import com.sharestory.sharestory_backend.repo.CommunityPostRepository;
import com.sharestory.sharestory_backend.repo.PostLikeRepository;
import com.sharestory.sharestory_backend.repo.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile; // ✅ import 추가

import java.io.IOException; // ✅ import 추가
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Transactional
public class CommunityService {

    private final S3Service s3Service;
    private final CommunityPostRepository postRepository;
    private final CommunityCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final PostLikeRepository postLikeRepository;
    // 게시글 생성 로직
    public PostResponseDto createPost(Long userId, PostRequestDto requestDto, MultipartFile image) throws IOException {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        String imageUrl = null;
        // ✅ [추가] 이미지가 있으면 S3에 업로드하고 URL을 받아옵니다.
        if (image != null && !image.isEmpty()) {
            imageUrl = s3Service.uploadFile(image, "community");
        }

        CommunityPost newPost = CommunityPost.builder()
                .author(author)
                .category(requestDto.getCategory())
                .title(requestDto.getTitle())
                .content(requestDto.getContent())
                .imageUrl(imageUrl) // ✅ 저장된 이미지 URL 설정
                .latitude(author.getMyLatitude())
                .longitude(author.getMyLongitude())
                .build();

        CommunityPost savedPost = postRepository.save(newPost);

        return PostResponseDto.fromEntity(savedPost);
    }
    @Transactional(readOnly = true)
    // ✅ [수정] String category 파라미터 추가
    public List<PostResponseDto> getPostsByLocation(Double lat, Double lon, Double distance, String category) {
        List<CommunityPost> posts;
        // ✅ [수정] category 값이 있는지 확인하는 분기 처리
        if (category != null && !category.isBlank()) {
            posts = postRepository.findPostsByLocationAndCategory(lat, lon, distance, category);
        } else {
            posts = postRepository.findPostsByLocation(lat, lon, distance);
        }

        return posts.stream()
                .map(PostResponseDto::fromEntity)
                .collect(Collectors.toList());
    }
    public PostResponseDto getPostById(Long postId, Long userId) {
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다: " + postId));

        post.setViewCount(post.getViewCount() + 1);

        boolean isLiked = false;
        if (userId != null) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            isLiked = postLikeRepository.findByUserAndPost(user, post).isPresent();
        }

        return PostResponseDto.fromEntity(post, isLiked);
    }

    @Transactional(readOnly = true)
    public List<CommentResponseDto> getCommentsByPostId(Long postId) {
        List<CommunityComment> comments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        return comments.stream()
                .map(CommentResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    public CommentResponseDto addComment(Long userId, Long postId, CommentRequestDto requestDto) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다: " + postId));

        CommunityComment newComment = CommunityComment.builder()
                .author(author)
                .post(post)
                .content(requestDto.getContent())
                .build();

        commentRepository.save(newComment);

        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);

        return CommentResponseDto.fromEntity(newComment);
    }

    public Map<String, Object> togglePostLike(Long userId, Long postId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        Optional<PostLike> existingLike = postLikeRepository.findByUserAndPost(user, post);

        boolean isLiked;
        if (existingLike.isPresent()) {
            // 이미 좋아요를 눌렀다면 -> 좋아요 취소
            postLikeRepository.delete(existingLike.get());
            post.setLikeCount(post.getLikeCount() - 1);
            isLiked = false;
        } else {
            // 좋아요를 누르지 않았다면 -> 좋아요 추가
            PostLike newLike = PostLike.builder().user(user).post(post).build();
            postLikeRepository.save(newLike);
            post.setLikeCount(post.getLikeCount() + 1);
            isLiked = true;
        }

        // Map을 사용하여 새로운 좋아요 수와 상태를 반환
        return Map.of(
                "likeCount", post.getLikeCount(),
                "isLiked", isLiked
        );
    }
    // CommunityService.java
// ...
    // ✅ [수정] updatePost 메소드 시그니처 변경 (MultipartFile image 추가)
    public PostResponseDto updatePost(Long userId, Long postId, PostRequestDto requestDto, MultipartFile image) throws IOException {
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        if (!post.getAuthor().getId().equals(userId)) {
            throw new AccessDeniedException("수정 권한이 없습니다.");
        }

        // ✅ [추가] 이미지 수정 로직
        if (image != null && !image.isEmpty()) {
            // 기존 이미지가 있다면 S3에서 삭제 (선택적 기능)
            if (post.getImageUrl() != null) {
                s3Service.deleteFile(post.getImageUrl());
            }
            // 새 이미지 업로드
            String newImageUrl = s3Service.uploadFile(image, "community");
            post.setImageUrl(newImageUrl);
        }

        post.setCategory(requestDto.getCategory());
        post.setTitle(requestDto.getTitle());
        post.setContent(requestDto.getContent());

        CommunityPost updatedPost = postRepository.save(post);

        return PostResponseDto.fromEntity(updatedPost);
    }
    // ...
    public void deletePost(Long userId, Long postId) {
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        // 작성자 본인인지 확인
        if (!post.getAuthor().getId().equals(userId)) {
            throw new AccessDeniedException("삭제 권한이 없습니다.");
        }

        postRepository.delete(post);
    }
}