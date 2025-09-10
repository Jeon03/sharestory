package com.sharestory.sharestory_backend.repo;
import com.sharestory.sharestory_backend.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByProviderAndProviderId(String provider, String providerId);
    Optional<User> findByEmail(String email);
}