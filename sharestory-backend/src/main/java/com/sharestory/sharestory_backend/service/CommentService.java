package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.Comment;
import com.sharestory.sharestory_backend.domain.CommunityPost;
import com.sharestory.sharestory_backend.domain.User;
import com.sharestory.sharestory_backend.dto.CommentDto;
import com.sharestory.sharestory_backend.repo.CommentRepository;
import com.sharestory.sharestory_backend.repo.CommunityPostRepository;
import com.sharestory.sharestory_backend.repo.UserRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommunityPostRepository postRepository;
    private final UserRepository userRepository;

    @Transactional
    public CommentDto addComment(Long postId, Long userId, String content, Long parentId) {
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));

        Comment comment = Comment.builder()
                .post(post)
                .author(user)
                .content(content)
                .createdAt(LocalDateTime.now())
                .build();

        if (parentId != null) {
            Comment parent = commentRepository.findById(parentId)
                    .orElseThrow(() -> new IllegalArgumentException("부모 댓글이 존재하지 않습니다."));
            comment.setParent(parent);
            parent.getReplies().add(comment);
        }

        commentRepository.save(comment);
        return CommentDto.from(comment);
    }

    @Transactional(readOnly = true)
    public List<CommentDto> getCommentsByPost(Long postId) {
        return commentRepository.findByPostIdAndParentIsNullOrderByCreatedAtAsc(postId)
                .stream()
                .map(CommentDto::from)
                .toList();
    }

    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글이 존재하지 않습니다."));

        // 작성자만 삭제 가능
        if (!comment.getAuthor().getId().equals(userId)) {
            throw new SecurityException("본인 댓글만 삭제할 수 있습니다.");
        }

        // 대댓글이 달려 있어도 CascadeType.ALL + orphanRemoval=true 덕분에 자동 삭제됨
        commentRepository.delete(comment);
    }
}
