package com.mobileshop.backend.controller;

import com.mobileshop.backend.model.Customer;
import com.mobileshop.backend.repository.CustomerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerRepository customerRepository;

    public CustomerController(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    /**
     * Silent sign-in:
     * - If token is sent and valid -> return that customer
     * - If no token / invalid -> create a new customer account
     */
    @PostMapping("/session")
    public Map<String, Object> createOrGetSession(@RequestBody(required = false) Map<String, String> body) {
        String incomingToken = body != null ? body.get("token") : null;

        Customer customer = null;
        if (incomingToken != null && !incomingToken.isBlank()) {
            customer = customerRepository.findByToken(incomingToken).orElse(null);
        }

        if (customer == null) {
            customer = new Customer();
            customer.setCustomerCode("CUST-" + System.currentTimeMillis() % 1000000);
            customer.setToken(UUID.randomUUID().toString().replace("-", ""));
            customer.setCreatedAt(LocalDateTime.now());
            customer.setAddressSavedByAdmin(false);
            customer = customerRepository.save(customer);
        }

        return toProfile(customer);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMyProfile(@RequestHeader(value = "X-Customer-Token", required = false) String token) {
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(401).build();
        }

        Optional<Customer> found = customerRepository.findByToken(token);
        if (found.isEmpty()) {
            return ResponseEntity.status(401).build();
        }

        return ResponseEntity.ok(toProfile(found.get()));
    }

    /**
     * Admin can fill customer details later.
     * For now this endpoint lets us set name/phone/address from Postman/browser testing.
     */
    @PutMapping("/{customerCode}/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @PathVariable String customerCode,
            @RequestBody Map<String, String> body
    ) {
        Optional<Customer> found = customerRepository.findByCustomerCode(customerCode);
        if (found.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Customer customer = found.get();
        if (body.get("name") != null) customer.setName(body.get("name"));
        if (body.get("phone") != null) customer.setPhone(body.get("phone"));
        if (body.get("addressLine") != null) customer.setAddressLine(body.get("addressLine"));
        if (body.get("city") != null) customer.setCity(body.get("city"));
        if (body.get("state") != null) customer.setState(body.get("state"));
        if (body.get("pincode") != null) customer.setPincode(body.get("pincode"));

        boolean hasAddress =
                customer.getAddressLine() != null && !customer.getAddressLine().isBlank()
                && customer.getCity() != null && !customer.getCity().isBlank()
                && customer.getPincode() != null && !customer.getPincode().isBlank();

        customer.setAddressSavedByAdmin(hasAddress);
        customer = customerRepository.save(customer);

        return ResponseEntity.ok(toProfile(customer));
    }

    private Map<String, Object> toProfile(Customer c) {
        Map<String, Object> map = new HashMap<>();
        map.put("customerCode", c.getCustomerCode());
        map.put("token", c.getToken());
        map.put("name", c.getName());
        map.put("phone", c.getPhone());
        map.put("addressLine", c.getAddressLine());
        map.put("city", c.getCity());
        map.put("state", c.getState());
        map.put("pincode", c.getPincode());
        map.put("addressSavedByAdmin", c.isAddressSavedByAdmin());
        map.put("createdAt", c.getCreatedAt() != null ? c.getCreatedAt().toString() : null);
        return map;
    }
}