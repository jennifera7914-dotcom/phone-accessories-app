package com.mobileshop.backend.repository;

import com.mobileshop.backend.model.ShoppingCart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<ShoppingCart, String> {

    // Find cart by customer ID (e.g., "DEMO-CUSTOMER")
    Optional<ShoppingCart> findByCustomerId(String customerId);
}