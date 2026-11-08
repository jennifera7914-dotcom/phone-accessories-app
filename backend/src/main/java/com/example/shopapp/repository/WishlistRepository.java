package com.example.shopapp.repository;

import com.example.shopapp.model.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    List<Wishlist> findByUserId(Long userId);

    void deleteByUserIdAndProductId(Long userId, Long productId);
}