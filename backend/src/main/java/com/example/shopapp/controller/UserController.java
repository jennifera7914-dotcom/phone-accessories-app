package com.example.shopapp.controller;

import com.example.shopapp.model.User;
import com.example.shopapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> request) {
        return ResponseEntity.badRequest().body(Map.of("message", "Public registration is disabled. Contact owner."));
    }

    // NEW LOGIN: accepts identifier = Phone OR Name + PIN
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> request) {
        String identifier = request.get("identifier");
        if (identifier == null) identifier = request.get("phone");
        if (identifier == null) identifier = request.get("name");
        String pin = request.get("pin");
        if (pin == null) pin = request.get("password");

        if (identifier == null || pin == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Phone/Name and PIN are required"));
        }

        Optional<User> userOpt = userService.loginByIdentifier(identifier, pin);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return ResponseEntity.ok(Map.of(
                    "message", "Login successful",
                    "userId", user.getId(),
                    "name", user.getName(),
                    "shopName", user.getShopName() != null ? user.getShopName() : "",
                    "phone", user.getPhone(),
                    "email", user.getEmail()
            ));
        }

        // Check why it failed to give correct message you wanted
        boolean exists = userService.existsByIdentifier(identifier);
        if (!exists) {
            return ResponseEntity.status(404).body(Map.of("message", "Not registered. Phone/Name not found. Contact shop owner."));
        } else {
            return ResponseEntity.status(401).body(Map.of("message", "Wrong PIN. Check your email or contact owner."));
        }
    }

    @GetMapping("/profile/{id}")
    public ResponseEntity<?> getUserProfile(@PathVariable Long id) {
        Optional<User> userOpt = userService.getUserById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return ResponseEntity.ok(Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "shopName", user.getShopName() != null ? user.getShopName() : "",
                    "phone", user.getPhone(),
                    "email", user.getEmail(),
                    "photoUrl", user.getPhotoUrl() != null ? user.getPhotoUrl() : ""
            ));
        }
        return ResponseEntity.status(404).body(Map.of("message", "User not found"));
    }

    @PutMapping("/profile/{id}")
    public ResponseEntity<?> updateUserProfile(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String name = request.get("name");
            String photoUrl = request.get("photoUrl");
            User user = userService.updateUser(id, name, photoUrl);
            return ResponseEntity.ok(Map.of("message", "Profile updated", "id", user.getId(), "name", user.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/check-approval/{id}")
    public ResponseEntity<?> checkApprovalStatus(@PathVariable Long id) {
        boolean isApproved = userService.isUserApproved(id);
        return ResponseEntity.ok(Map.of("userId", id, "isApproved", isApproved));
    }
}