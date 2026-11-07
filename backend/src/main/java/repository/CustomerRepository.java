package com.mobileshop.backend.repository;

import com.mobileshop.backend.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByToken(String token);
    Optional<Customer> findByCustomerCode(String customerCode);
}