package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.Comment;
import com.sharestory.sharestory_backend.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostIdAndParentIsNullOrderByCreatedAtAsc(Long postId);
    List<Comment> findByAuthor(User author);
}

