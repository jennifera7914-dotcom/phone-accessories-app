package com.example.shopapp.service;

import com.example.shopapp.model.Address;
import com.example.shopapp.model.User;
import com.example.shopapp.repository.AddressRepository;
import com.example.shopapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private EmailService emailService;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private Random random = new Random();

    private void validatePhone(String phone) {
        if (phone == null || !phone.matches("\\d{10}")) {
            throw new RuntimeException("Phone number must be exactly 10 digits (numbers only)");
        }
    }

    private void validateAltPhone(String alt) {
        if (alt != null && !alt.isEmpty() && !alt.matches("\\d{10}")) {
            throw new RuntimeException("Alternate phone must be exactly 10 digits (numbers only)");
        }
    }

    private void validateEmail(String email) {
        if (email == null || !email.toLowerCase().endsWith("@gmail.com")) {
            throw new RuntimeException("Email must end with @gmail.com");
        }
    }

    // OWNER CREATES CUSTOMER -> AUTO PIN -> SAVE -> SEND GMAIL
    public User createCustomer(String name, String shopName, String phone, String alternatePhone, String email, String gstNumber,
                               String line1, String line2, String city, String state, String pincode) {

        validatePhone(phone);
        validateAltPhone(alternatePhone);
        validateEmail(email);

        if (userRepository.existsByPhone(phone)) {
            throw new RuntimeException("Phone number already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }

        String pin = String.valueOf(1000 + random.nextInt(9000));
        System.out.println("🔑 Generated PIN for " + phone + " is: " + pin);

        User user = new User();
        user.setName(name);
        user.setShopName(shopName);
        user.setPhone(phone);
        user.setAlternatePhone(alternatePhone);
        user.setEmail(email);
        user.setGstNumber(gstNumber);
        user.setPasswordHash(passwordEncoder.encode(pin));
        user.setIsApproved(true);

        User savedUser = userRepository.save(user);

        Address address = new Address();
        address.setUserId(savedUser.getId());
        address.setLabel("Shop");
        address.setName(name);
        address.setPhone(phone);
        address.setLine1(line1);
        address.setLine2(line2);
        address.setCity(city);
        address.setState(state);
        address.setPincode(pincode);
        address.setIsDefault(true);
        addressRepository.save(address);

        emailService.sendPinEmail(email, name, shopName, pin, phone);

        return savedUser;
    }

    // LOGIN with Phone OR Name + PIN
    public Optional<User> loginUser(String phone, String pin) {
        return loginByIdentifier(phone, pin);
    }

    public Optional<User> loginByIdentifier(String identifier, String pin) {
        if (identifier == null || pin == null) return Optional.empty();
        String id = identifier.trim();
        Optional<User> userOpt;
        if (id.matches("\\d{10}")) {
            userOpt = userRepository.findByPhone(id);
        } else {
            userOpt = userRepository.findByNameIgnoreCase(id);
        }
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (passwordEncoder.matches(pin, user.getPasswordHash())) {
                return userOpt;
            }
        }
        return Optional.empty();
    }

    public boolean existsByIdentifier(String identifier) {
        if (identifier == null) return false;
        String id = identifier.trim();
        if (id.matches("\\d{10}")) {
            return userRepository.existsByPhone(id);
        } else {
            return userRepository.findByNameIgnoreCase(id).isPresent();
        }
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public void deleteUser(Long id) {
        List<Address> addresses = addressRepository.findByUserId(id);
        addressRepository.deleteAll(addresses);
        userRepository.deleteById(id);
    }

    // EDIT - ID NEVER CHANGES
    public User updateCustomer(Long id, String name, String shopName, String phone, String alternatePhone, String email, String gstNumber,
                               String line1, String line2, String city, String state, String pincode) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Customer not found"));

        validatePhone(phone);
        validateAltPhone(alternatePhone);
        validateEmail(email);

        if (!user.getPhone().equals(phone) && userRepository.existsByPhone(phone)) {
            throw new RuntimeException("Phone number already exists");
        }
        if (!user.getEmail().equalsIgnoreCase(email) && userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }

        user.setName(name);
        user.setShopName(shopName);
        user.setPhone(phone);
        user.setAlternatePhone(alternatePhone);
        user.setEmail(email);
        user.setGstNumber(gstNumber);
        User savedUser = userRepository.save(user);

        List<Address> addresses = addressRepository.findByUserId(id);
        Address address;
        if (addresses.isEmpty()) {
            address = new Address();
            address.setUserId(id);
            address.setLabel("Shop");
            address.setIsDefault(true);
        } else {
            address = addresses.get(0);
        }
        address.setName(name);
        address.setPhone(phone);
        address.setLine1(line1);
        address.setLine2(line2);
        address.setCity(city);
        address.setState(state);
        address.setPincode(pincode);
        addressRepository.save(address);

        return savedUser;
    }

    public User registerUser(String name, String phone, String password) {
        throw new RuntimeException("Public registration is disabled. Contact owner.");
    }

    public User updateUser(Long id, String name, String photoUrl) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (name != null) user.setName(name);
            if (photoUrl != null) user.setPhotoUrl(photoUrl);
            return userRepository.save(user);
        }
        throw new RuntimeException("User not found");
    }

    public boolean isUserApproved(Long id) {
        return userRepository.findById(id).map(User::getIsApproved).orElse(false);
    }
}