package com.example.shopapp.controller;

import com.example.shopapp.model.Admin;
import com.example.shopapp.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminAuthController {

    @Autowired
    private AdminService adminService;

    // CHECK - Has owner already been created? Used by admin-setup.html to lock itself
    @GetMapping("/check-setup")
    public ResponseEntity<?> checkSetup() {
        boolean exists = adminService.adminExists();
        return ResponseEntity.ok(Map.of("adminExists", exists));
    }

    // ONE-TIME SETUP - Now with Recovery Email - NO hardcode, owner creates his OWN 2 Gmails
    @PostMapping("/setup")
    public ResponseEntity<?> setupAdmin(@RequestBody Map<String, String> req) {
        try {
            String email = req.get("email");
            String recoveryEmail = req.get("recoveryEmail");
            String password = req.get("password");
            // Old frontend sends only email, make backward compatible
            if (recoveryEmail == null) recoveryEmail = req.get("recovery_email");
            if (email == null || recoveryEmail == null || password == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Primary Email, Recovery Email and Password are required"));
            }
            Admin admin = adminService.setupAdmin(email, recoveryEmail, password);
            return ResponseEntity.ok(Map.of(
                    "message", "Owner account created successfully ✅",
                    "adminId", admin.getId(),
                    "email", admin.getEmail()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // LOGIN - Owner daily login with Email + Password
    @PostMapping("/login")
    public ResponseEntity<?> loginAdmin(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        String password = req.get("password");
        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and Password are required"));
        }
        Optional<Admin> adminOpt = adminService.loginAdmin(email, password);
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            return ResponseEntity.ok(Map.of(
                    "message", "Login successful",
                    "adminId", admin.getId(),
                    "email", admin.getEmail()
            ));
        }
        return ResponseEntity.status(401).body(Map.of("message", "Wrong email or password"));
    }

    // FORGOT PASSWORD - Step 1: Send 6-digit OTP to Primary Email
    @PostMapping("/forgot-password/request")
    public ResponseEntity<?> requestPasswordOtp(@RequestBody Map<String, String> req) {
        try {
            String email = req.get("email");
            if (email == null) return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
            adminService.requestPasswordOtp(email);
            return ResponseEntity.ok(Map.of("message", "OTP sent to " + email.toLowerCase() + " ✅ Valid for 10 minutes"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to send OTP: " + e.getMessage()));
        }
    }

    // FORGOT PASSWORD - Step 2: Verify OTP + Set New Password
    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> req) {
        try {
            String email = req.get("email");
            String otp = req.get("otp");
            String newPassword = req.get("newPassword");
            if (newPassword == null) newPassword = req.get("password");
            if (email == null || otp == null || newPassword == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email, OTP and New Password are required"));
            }
            adminService.resetPasswordWithOtp(email, otp, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password reset successful ✅ Please login with new password"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // FORGOT EMAIL - Send Primary Email reminder to Recovery Email
    @PostMapping("/forgot-email")
    public ResponseEntity<?> forgotEmail(@RequestBody Map<String, String> req) {
        try {
            String recoveryEmail = req.get("recoveryEmail");
            if (recoveryEmail == null) recoveryEmail = req.get("recovery_email");
            if (recoveryEmail == null) recoveryEmail = req.get("email");
            if (recoveryEmail == null) return ResponseEntity.badRequest().body(Map.of("message", "Recovery Email is required"));
            adminService.sendEmailReminder(recoveryEmail);
            return ResponseEntity.ok(Map.of("message", "Your Primary Owner Email has been sent to " + recoveryEmail.toLowerCase() + " ✅"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to send email: " + e.getMessage()));
        }
    }
}