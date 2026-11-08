package com.mobileshop.backend.controller;

import com.mobileshop.backend.model.Customer;
import com.mobileshop.backend.model.Notification;
import com.mobileshop.backend.repository.CustomerRepository;
import com.mobileshop.backend.repository.NotificationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository repo;
    private final CustomerRepository customerRepository;

    public NotificationController(
            NotificationRepository repo,
            CustomerRepository customerRepository) {
        this.repo = repo;
        this.customerRepository = customerRepository;
    }

    private Optional<Customer> customerFromToken(String token) {
        if (token == null || token.isBlank()) return Optional.empty();
        return customerRepository.findByToken(token);
    }

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestHeader(value = "X-Customer-Token", required = false) String token) {

        Optional<Customer> customer = customerFromToken(token);
        if (customer.isEmpty()) {
            return ResponseEntity.status(401).body("Invalid customer token");
        }

        List<Notification> list =
                repo.findByCustomerIdOrderByIdDesc(customer.get().getCustomerCode());

        return ResponseEntity.ok(list);
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<?> markAllRead(
            @RequestHeader(value = "X-Customer-Token", required = false) String token) {

        Optional<Customer> customer = customerFromToken(token);
        if (customer.isEmpty()) {
            return ResponseEntity.status(401).body("Invalid customer token");
        }

        List<Notification> list =
                repo.findByCustomerIdOrderByIdDesc(customer.get().getCustomerCode());

        for (Notification notification : list) {
            notification.setRead(true);
        }

        return ResponseEntity.ok(repo.saveAll(list));
    }
}