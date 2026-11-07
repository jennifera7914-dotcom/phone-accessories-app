package com.mobileshop.backend.controller;

import com.mobileshop.backend.model.Customer;
import com.mobileshop.backend.model.CustomerOrder;
import com.mobileshop.backend.model.Notification;
import com.mobileshop.backend.model.OrderStatusHistory;
import com.mobileshop.backend.repository.CustomerRepository;
import com.mobileshop.backend.repository.NotificationRepository;
import com.mobileshop.backend.repository.OrderRepository;
import com.mobileshop.backend.repository.OrderStatusHistoryRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    // Simplified: placed -> delivered, or placed -> cancelled. Nothing else.
    private static final Map<String, List<String>> NEXT_STEPS = Map.of(
            "placed", List.of("delivered", "cancelled"),
            "delivered", List.of(),
            "cancelled", List.of()
    );

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository historyRepository;
    private final NotificationRepository notificationRepository;
    private final CustomerRepository customerRepository;

    @Value("${admin.api.token:}")
    private String adminToken;

    public AdminController(OrderRepository orderRepository,
                           OrderStatusHistoryRepository historyRepository,
                           NotificationRepository notificationRepository,
                           CustomerRepository customerRepository) {
        this.orderRepository = orderRepository;
        this.historyRepository = historyRepository;
        this.notificationRepository = notificationRepository;
        this.customerRepository = customerRepository;
    }

    private boolean isAdmin(String token) {
        return adminToken != null && !adminToken.isBlank() && adminToken.equals(token);
    }

    private ResponseEntity<String> denied() {
        return ResponseEntity.status(401).body("Admin password is wrong or missing.");
    }

    private Map<String, Customer> customerIndex() {
        return customerRepository.findAll().stream()
                .collect(Collectors.toMap(Customer::getCustomerCode, c -> c, (a, b) -> a));
    }

    private Map<String, Object> orderView(CustomerOrder o, Map<String, Customer> customers) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", o.getId());
        m.put("orderCode", o.getOrderCode());
        m.put("status", o.getStatus());
        m.put("total", o.getTotal());
        m.put("items", o.getItems());
        m.put("address", o.getAddress());
        m.put("orderDate", o.getOrderDate());
        m.put("placedAt", o.getPlacedAt());
        m.put("customerId", o.getCustomerId());
        m.put("estimatedDelivery", o.getEstimatedDelivery());
        Customer c = o.getCustomerId() == null ? null : customers.get(o.getCustomerId());
        m.put("customerName", c != null ? c.getName() : null);
        m.put("customerPhone", c != null ? c.getPhone() : null);
        return m;
    }

    private Map<String, Object> customerView(Customer c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("customerCode", c.getCustomerCode());
        m.put("name", c.getName());
        m.put("phone", c.getPhone());
        m.put("addressLine", c.getAddressLine());
        m.put("city", c.getCity());
        m.put("state", c.getState());
        m.put("pincode", c.getPincode());
        m.put("addressSavedByAdmin", c.isAddressSavedByAdmin());
        m.put("createdAt", c.getCreatedAt() == null ? null : c.getCreatedAt().toString());
        return m;
    }

    private void recordHistory(CustomerOrder o, String status, String note, String changedBy) {
        OrderStatusHistory h = new OrderStatusHistory();
        h.setOrderId(o.getId());
        h.setStatus(status);
        h.setNote(note);
        h.setChangedBy(changedBy);
        h.setChangedAt(LocalDateTime.now());
        historyRepository.save(h);
    }

    private void notify(String title, String body) {
        Notification n = new Notification();
        n.setTitle(title);
        n.setBody(body);
        n.setDate(LocalDate.now().toString());
        n.setRead(false);
        notificationRepository.save(n);
    }

    private String clean(String v) { return v == null ? null : v.trim(); }
    private boolean notEmpty(String s) { return s != null && !s.trim().isEmpty(); }

    @GetMapping("/check")
    public ResponseEntity<?> check(@RequestHeader(value = "X-Admin-Token", required = false) String token) {
        if (!isAdmin(token)) return denied();
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/orders")
    public ResponseEntity<?> listOrders(@RequestHeader(value = "X-Admin-Token", required = false) String token) {
        if (!isAdmin(token)) return denied();
        Map<String, Customer> customers = customerIndex();
        List<Map<String, Object>> result = orderRepository.findAll().stream()
                .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
                .map(o -> orderView(o, customers))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/orders/{id}/history")
    public ResponseEntity<?> orderHistory(@RequestHeader(value = "X-Admin-Token", required = false) String token,
                                          @PathVariable Long id) {
        if (!isAdmin(token)) return denied();
        return ResponseEntity.ok(historyRepository.findByOrderIdOrderByChangedAtAsc(id));
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<?> updateStatus(@RequestHeader(value = "X-Admin-Token", required = false) String token,
                                          @PathVariable Long id,
                                          @RequestBody Map<String, String> body) {
        if (!isAdmin(token)) return denied();

        Optional<CustomerOrder> found = orderRepository.findById(id);
        if (found.isEmpty()) return ResponseEntity.notFound().build();

        CustomerOrder order = found.get();
        String current = order.getStatus() == null ? "" : order.getStatus();
        String next = clean(body.get("status"));
        List<String> allowed = NEXT_STEPS.getOrDefault(current, List.of());

        if (next == null || !allowed.contains(next)) {
            return ResponseEntity.badRequest().body("Cannot change status from '" + current + "' to '" + next + "'.");
        }

        order.setStatus(next);
        CustomerOrder saved = orderRepository.save(order);

        String note = clean(body.get("note"));
        if (note == null || note.isEmpty()) {
            note = "delivered".equals(next) ? "Delivered by the shop" : "Cancelled by the shop";
        }
        recordHistory(saved, next, note, "admin");
        notify("Order update", "Order " + saved.getOrderCode() + " is now " + next + ".");

        return ResponseEntity.ok(orderView(saved, customerIndex()));
    }

    // Optional expected-delivery date the admin can set (nothing else to maintain)
    @PutMapping("/orders/{id}/delivery")
    public ResponseEntity<?> updateDelivery(@RequestHeader(value = "X-Admin-Token", required = false) String token,
                                            @PathVariable Long id,
                                            @RequestBody Map<String, String> body) {
        if (!isAdmin(token)) return denied();
        Optional<CustomerOrder> found = orderRepository.findById(id);
        if (found.isEmpty()) return ResponseEntity.notFound().build();

        CustomerOrder order = found.get();
        if (body.containsKey("estimatedDelivery")) order.setEstimatedDelivery(clean(body.get("estimatedDelivery")));
        CustomerOrder saved = orderRepository.save(order);
        recordHistory(saved, saved.getStatus(), "Expected delivery date set", "admin");
        notify("Delivery date", "Order " + saved.getOrderCode() + " is expected by " + saved.getEstimatedDelivery() + ".");
        return ResponseEntity.ok(orderView(saved, customerIndex()));
    }

    @GetMapping("/customers")
    public ResponseEntity<?> listCustomers(@RequestHeader(value = "X-Admin-Token", required = false) String token) {
        if (!isAdmin(token)) return denied();
        return ResponseEntity.ok(customerRepository.findAll().stream().map(this::customerView).collect(Collectors.toList()));
    }

    @PutMapping("/customers/{customerCode}/profile")
    public ResponseEntity<?> saveCustomer(@RequestHeader(value = "X-Admin-Token", required = false) String token,
                                          @PathVariable String customerCode,
                                          @RequestBody Map<String, String> body) {
        if (!isAdmin(token)) return denied();

        Optional<Customer> found = customerRepository.findByCustomerCode(customerCode);
        if (found.isEmpty()) return ResponseEntity.notFound().build();

        Customer c = found.get();
        if (body.containsKey("pincode")) {
            String pin = clean(body.get("pincode"));
            if (pin != null && !pin.isEmpty() && !pin.matches("\\d{6}")) {
                return ResponseEntity.badRequest().body("Pincode must be exactly 6 digits.");
            }
            c.setPincode(pin);
        }
        if (body.containsKey("name")) c.setName(clean(body.get("name")));
        if (body.containsKey("phone")) c.setPhone(clean(body.get("phone")));
        if (body.containsKey("addressLine")) c.setAddressLine(clean(body.get("addressLine")));
        if (body.containsKey("city")) c.setCity(clean(body.get("city")));
        if (body.containsKey("state")) c.setState(clean(body.get("state")));

        c.setAddressSavedByAdmin(notEmpty(c.getAddressLine()) && notEmpty(c.getCity()) && notEmpty(c.getPincode()));
        return ResponseEntity.ok(customerView(customerRepository.save(c)));
    }
}
