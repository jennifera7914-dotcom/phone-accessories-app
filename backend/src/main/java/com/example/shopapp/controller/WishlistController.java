package com.example.shopapp.controller;

import com.example.shopapp.model.Wishlist;
import com.example.shopapp.repository.WishlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(origins = "*")
public class WishlistController {

    @Autowired
    private WishlistRepository wishlistRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getWishlistByUser(@PathVariable Long userId) {
        List<Wishlist> wishlist = wishlistRepository.findByUserId(userId);
        return ResponseEntity.ok(wishlist);
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToWishlist(@RequestBody Map<String, Long> request) {
        try {
            Long userId = request.get("userId");
            Long productId = request.get("productId");

            Wishlist wishlist = new Wishlist();
            wishlist.setUserId(userId);
            wishlist.setProductId(productId);

            Wishlist savedWishlist = wishlistRepository.save(wishlist);
            return ResponseEntity.ok(Map.of(
                    "message", "Added to wishlist successfully",
                    "wishlistId", savedWishlist.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error adding to wishlist: " + e.getMessage());
        }
    }

    @DeleteMapping("/remove")
    public ResponseEntity<?> removeFromWishlist(@RequestParam Long userId, @RequestParam Long productId) {
        try {
            wishlistRepository.deleteByUserIdAndProductId(userId, productId);
            return ResponseEntity.ok(Map.of("message", "Removed from wishlist successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error removing from wishlist: " + e.getMessage());
        }
    }
}