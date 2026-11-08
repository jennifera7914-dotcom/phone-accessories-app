package com.example.shopapp.controller;

import com.example.shopapp.model.User;
import com.example.shopapp.repository.AddressRepository;
import com.example.shopapp.model.Address;
import com.example.shopapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private AddressRepository addressRepository;

    // 1. CREATE - City/State optional now
    @PostMapping("/customers")
    public ResponseEntity<?> createCustomer(@RequestBody Map<String, String> req) {
        try {
            String name = req.get("name");
            String shopName = req.get("shopName");
            String phone = req.get("phone");
            String alternatePhone = req.get("alternatePhone");
            String email = req.get("email");
            String gstNumber = req.get("gstNumber");
            String line1 = req.get("line1");
            String line2 = req.get("line2");
            String city = req.get("city");
            String state = req.get("state");
            String pincode = req.get("pincode");

            if (name == null || name.isEmpty() || shopName == null || shopName.isEmpty() || phone == null || phone.isEmpty() || email == null || email.isEmpty() || line1 == null || line1.isEmpty() || pincode == null || pincode.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Please fill Name, Shop Name, Phone, Email, Address Line 1 and Pincode"));
            }
            User saved = userService.createCustomer(name, shopName, phone, alternatePhone, email, gstNumber, line1, line2, city, state, pincode);
            return ResponseEntity.ok(Map.of("message", "Customer created & PIN sent to " + email + " ✅", "userId", saved.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // 2. SEE ALL
    @GetMapping("/customers")
    public ResponseEntity<?> getAllCustomers() {
        List<User> users = userService.getAllUsers();
        List<Map<String, Object>> result = users.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("name", u.getName());
            map.put("shopName", u.getShopName());
            map.put("phone", u.getPhone());
            map.put("alternatePhone", u.getAlternatePhone());
            map.put("email", u.getEmail());
            map.put("gstNumber", u.getGstNumber());
            List<Address> addrs = addressRepository.findByUserId(u.getId());
            map.put("address", addrs.isEmpty() ? null : addrs.get(0));
            return map;
        }).toList();
        return ResponseEntity.ok(result);
    }

    // 3. GET ONE
    @GetMapping("/customers/{id}")
    public ResponseEntity<?> getCustomer(@PathVariable Long id) {
        Optional<User> uOpt = userService.getUserById(id);
        if(uOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message","Not found"));
        User u = uOpt.get();
        List<Address> addrs = addressRepository.findByUserId(id);
        Map<String, Object> map = new HashMap<>();
        map.put("id", u.getId());
        map.put("name", u.getName());
        map.put("shopName", u.getShopName());
        map.put("phone", u.getPhone());
        map.put("alternatePhone", u.getAlternatePhone());
        map.put("email", u.getEmail());
        map.put("gstNumber", u.getGstNumber());
        map.put("address", addrs.isEmpty() ? null : addrs.get(0));
        return ResponseEntity.ok(map);
    }

    // 4. EDIT - ID NEVER CHANGES
    @PutMapping("/customers/{id}")
    public ResponseEntity<?> updateCustomer(@PathVariable Long id, @RequestBody Map<String, String> req) {
        try {
            String name = req.get("name");
            String shopName = req.get("shopName");
            String phone = req.get("phone");
            String alternatePhone = req.get("alternatePhone");
            String email = req.get("email");
            String gstNumber = req.get("gstNumber");
            String line1 = req.get("line1");
            String line2 = req.get("line2");
            String city = req.get("city");
            String state = req.get("state");
            String pincode = req.get("pincode");

            if (name == null || name.isEmpty() || shopName == null || shopName.isEmpty() || phone == null || phone.isEmpty() || email == null || email.isEmpty() || line1 == null || line1.isEmpty() || pincode == null || pincode.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Please fill Name, Shop Name, Phone, Email, Address Line 1 and Pincode"));
            }
            User updated = userService.updateCustomer(id, name, shopName, phone, alternatePhone, email, gstNumber, line1, line2, city, state, pincode);
            return ResponseEntity.ok(Map.of("message", "Customer updated successfully ✅", "userId", updated.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // 5. DELETE
    @DeleteMapping("/customers/{id}")
    public ResponseEntity<?> deleteCustomer(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(Map.of("message", "Customer deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}