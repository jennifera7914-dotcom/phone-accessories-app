package com.example.shopapp.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(name = "shop_name")
    private String shopName;

    @Column(unique = true)
    private String phone;

    @Column(name = "alternate_phone")
    private String alternatePhone;

    @Column(unique = true)
    private String email;

    @Column(name = "gst_number")
    private String gstNumber;

    private String passwordHash; // 4-digit PIN saved as hash

    private String photoUrl;

    private Boolean isApproved = true;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}