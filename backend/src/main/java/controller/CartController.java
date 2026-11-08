package com.mobileshop.backend.controller;

import com.mobileshop.backend.model.Customer;
import com.mobileshop.backend.model.ShoppingCart;
import com.mobileshop.backend.repository.CartRepository;
import com.mobileshop.backend.repository.CustomerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartRepository cartRepository;
    private final CustomerRepository customerRepository;

    public CartController(CartRepository cartRepository, CustomerRepository customerRepository) {
        this.cartRepository = cartRepository;
        this.customerRepository = customerRepository;
    }

    private Customer customerFromToken(String token) {
        if (token == null || token.isBlank()) return null;
        return customerRepository.findByToken(token).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> getCart(
            @RequestHeader(value = "X-Customer-Token", required = false) String token) {

        Customer customer = customerFromToken(token);
        if (customer == null) {
            return ResponseEntity.status(401).body("Invalid customer token");
        }

        ShoppingCart cart = cartRepository
                .findByCustomerId(customer.getCustomerCode())
                .orElse(null);

        Map<String, String> response = new HashMap<>();
        response.put("items",
                cart != null && cart.getCartItems() != null ? cart.getCartItems() : "[]");
        response.put("savedForLater",
                cart != null && cart.getSavedItems() != null ? cart.getSavedItems() : "[]");

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> updateCart(
            @RequestHeader(value = "X-Customer-Token", required = false) String token,
            @RequestBody Map<String, String> payload) {

        Customer customer = customerFromToken(token);
        if (customer == null) {
            return ResponseEntity.status(401).body("Invalid customer token");
        }

        cartRepository.save(new ShoppingCart(
                customer.getCustomerCode(),
                payload.getOrDefault("items", "[]"),
                payload.getOrDefault("savedForLater", "[]")
        ));

        return ResponseEntity.ok("Cart saved to MySQL");
    }
}