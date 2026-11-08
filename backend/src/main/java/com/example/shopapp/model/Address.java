package com.example.shopapp.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "addresses")
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private String label;

    private String name;

    private String phone;

    private String line1;

    private String line2;

    private String city;

    private String state;

    private String pincode;

    private Boolean isDefault = false;
}