package com.example.shopapp.controller;

import com.example.shopapp.model.Address;
import com.example.shopapp.repository.AddressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/address")
@CrossOrigin(origins = "*")
public class AddressController {

    @Autowired
    private AddressRepository addressRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getAddressesByUser(@PathVariable Long userId) {
        List<Address> addresses = addressRepository.findByUserId(userId);
        return ResponseEntity.ok(addresses);
    }

    @PostMapping("/add")
    public ResponseEntity<?> addAddress(@RequestBody Map<String, Object> request) {
        try {
            Address address = new Address();
            address.setUserId(Long.valueOf(request.get("userId").toString()));
            address.setLabel((String) request.get("label"));
            address.setName((String) request.get("name"));
            address.setPhone((String) request.get("phone"));
            address.setLine1((String) request.get("line1"));
            address.setLine2((String) request.get("line2"));
            address.setCity((String) request.get("city"));
            address.setState((String) request.get("state"));
            address.setPincode((String) request.get("pincode"));
            address.setIsDefault(Boolean.valueOf(request.get("isDefault").toString()));

            Address savedAddress = addressRepository.save(address);
            return ResponseEntity.ok(Map.of(
                    "message", "Address added successfully",
                    "addressId", savedAddress.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error adding address: " + e.getMessage());
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateAddress(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            Address address = addressRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Address not found"));

            if (request.get("label") != null) address.setLabel((String) request.get("label"));
            if (request.get("name") != null) address.setName((String) request.get("name"));
            if (request.get("phone") != null) address.setPhone((String) request.get("phone"));
            if (request.get("line1") != null) address.setLine1((String) request.get("line1"));
            if (request.get("line2") != null) address.setLine2((String) request.get("line2"));
            if (request.get("city") != null) address.setCity((String) request.get("city"));
            if (request.get("state") != null) address.setState((String) request.get("state"));
            if (request.get("pincode") != null) address.setPincode((String) request.get("pincode"));
            if (request.get("isDefault") != null) address.setIsDefault(Boolean.valueOf(request.get("isDefault").toString()));

            Address updatedAddress = addressRepository.save(address);
            return ResponseEntity.ok(Map.of(
                    "message", "Address updated successfully",
                    "addressId", updatedAddress.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating address: " + e.getMessage());
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteAddress(@PathVariable Long id) {
        try {
            addressRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Address deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error deleting address: " + e.getMessage());
        }
    }
}