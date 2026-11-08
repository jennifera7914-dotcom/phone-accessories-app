package com.example.shopapp.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // This is called automatically when owner creates a customer
    public void sendPinEmail(String toEmail, String customerName, String shopName, String pin, String phone) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Welcome to Mobile Accessory Hub - Your Login PIN");
            message.setText(
                    "Hi " + customerName + ",\n\n" +
                            "Your shop '" + shopName + "' is registered with Mobile Accessory Hub ✅\n\n" +
                            "Your Login Details:\n" +
                            "Phone Number: " + phone + "\n" +
                            "PIN: " + pin + "\n\n" +
                            "Download the Mobile Accessory Hub App and login with your Phone Number and PIN.\n\n" +
                            "If you have any issue, contact shop owner.\n\n" +
                            "Thank you!"
            );
            mailSender.send(message);
            System.out.println("✅ Email sent to " + toEmail + " with PIN " + pin);
        } catch (Exception e) {
            System.out.println("❌ Email failed to " + toEmail + " : " + e.getMessage());
            // We don't throw error - customer is still created even if email fails
        }
    }
}