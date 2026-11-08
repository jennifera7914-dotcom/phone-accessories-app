package com.example.shopapp.service;

import com.example.shopapp.model.Admin;
import com.example.shopapp.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class AdminService {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private Random random = new Random();

    public boolean adminExists() {
        return adminRepository.count() > 0;
    }

    // ONE-TIME SETUP - Now with Recovery Email
    public Admin setupAdmin(String email, String recoveryEmail, String password) {
        if (adminExists()) {
            throw new RuntimeException("Owner already exists. Please login.");
        }
        if (email == null || !email.toLowerCase().endsWith("@gmail.com")) {
            throw new RuntimeException("Owner email must end with @gmail.com");
        }
        if (recoveryEmail == null || !recoveryEmail.toLowerCase().endsWith("@gmail.com")) {
            throw new RuntimeException("Recovery email must end with @gmail.com");
        }
        if (email.equalsIgnoreCase(recoveryEmail)) {
            throw new RuntimeException("Primary and Recovery email must be different");
        }
        if (password == null || password.length() < 4) {
            throw new RuntimeException("Password must be at least 4 characters");
        }
        if (adminRepository.existsByEmail(email.toLowerCase())) {
            throw new RuntimeException("Owner email already registered");
        }

        Admin admin = new Admin();
        admin.setEmail(email.toLowerCase());
        admin.setRecoveryEmail(recoveryEmail.toLowerCase());
        admin.setPasswordHash(passwordEncoder.encode(password));
        Admin saved = adminRepository.save(admin);

        // Send welcome mail to both
        try {
            SimpleMailMessage m1 = new SimpleMailMessage();
            m1.setFrom(fromEmail);
            m1.setTo(saved.getEmail());
            m1.setSubject("Mobile Accessory Hub - Owner Account Created");
            m1.setText("Hi Owner,\n\nYour Owner account is created successfully.\nPrimary Email: " + saved.getEmail() + "\nRecovery Email: " + saved.getRecoveryEmail() + "\n\nKeep this safe. Use Forgot Password if you forget.");
            mailSender.send(m1);
        } catch (Exception e) { System.out.println("Setup mail fail: " + e.getMessage()); }

        return saved;
    }

    public Optional<Admin> loginAdmin(String email, String password) {
        if (email == null || password == null) return Optional.empty();
        Optional<Admin> opt = adminRepository.findByEmail(email.toLowerCase());
        if (opt.isPresent() && passwordEncoder.matches(password, opt.get().getPasswordHash())) {
            return opt;
        }
        return Optional.empty();
    }

    // FORGOT PASSWORD - Step 1: Send 6-digit OTP to Primary Email
    public void requestPasswordOtp(String email) {
        Admin admin = adminRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new RuntimeException("Owner email not found"));
        String otp = String.valueOf(100000 + random.nextInt(900000));
        admin.setOtp(otp);
        admin.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        adminRepository.save(admin);

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromEmail);
        msg.setTo(admin.getEmail());
        msg.setSubject("Mobile Accessory Hub - Owner Password Reset OTP");
        msg.setText("Your OTP to reset Owner password is: " + otp + "\n\nValid for 10 minutes.\nIf you did not request, ignore this mail.");
        mailSender.send(msg);
        System.out.println("🔑 Owner OTP for " + email + " is " + otp);
    }

    // FORGOT PASSWORD - Step 2: Verify OTP + Set New Password
    public void resetPasswordWithOtp(String email, String otp, String newPassword) {
        Admin admin = adminRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new RuntimeException("Owner email not found"));
        if (admin.getOtp() == null || !admin.getOtp().equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }
        if (admin.getOtpExpiry() == null || admin.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP expired. Request again.");
        }
        if (newPassword == null || newPassword.length() < 4) {
            throw new RuntimeException("Password must be at least 4 characters");
        }
        admin.setPasswordHash(passwordEncoder.encode(newPassword));
        admin.setOtp(null);
        admin.setOtpExpiry(null);
        adminRepository.save(admin);
    }

    // FORGOT EMAIL - Send Primary Email to Recovery Email
    public void sendEmailReminder(String recoveryEmail) {
        Admin admin = adminRepository.findByRecoveryEmail(recoveryEmail.toLowerCase())
                .orElseThrow(() -> new RuntimeException("Recovery email not found"));
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromEmail);
        msg.setTo(admin.getRecoveryEmail());
        msg.setSubject("Mobile Accessory Hub - Your Owner Email Reminder");
        msg.setText("Hi Owner,\n\nYour Primary Owner Email is: " + admin.getEmail() + "\n\nUse it to login or to reset password via Forgot Password.\n\nIf you did not request, ignore.");
        mailSender.send(msg);
    }
}