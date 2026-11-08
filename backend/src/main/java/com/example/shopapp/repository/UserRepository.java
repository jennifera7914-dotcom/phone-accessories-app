package com.example.shopapp.repository;

import com.example.shopapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPhone(String phone);
    boolean existsByPhone(String phone);
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByNameIgnoreCase(String name);
}