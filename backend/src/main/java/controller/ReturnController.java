package com.mobileshop.backend.controller;

import com.mobileshop.backend.model.Customer;
import com.mobileshop.backend.model.CustomerOrder;
import com.mobileshop.backend.model.Notification;
import com.mobileshop.backend.model.ReturnRequest;
import com.mobileshop.backend.repository.CustomerRepository;
import com.mobileshop.backend.repository.NotificationRepository;
import com.mobileshop.backend.repository.OrderRepository;
import com.mobileshop.backend.repository.ReturnRequestRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
public class ReturnController {

    private static final Set<String> ALLOWED_ACTIONS = Set.of("return", "exchange");
    private static final Set<String> ALLOWED_DECISIONS = Set.of("approved", "rejected");

    private final ReturnRequestRepository returnRepository;
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final NotificationRepository notificationRepository;

    @Value("${admin.api.token:}")
    private String adminToken;

    public ReturnController(ReturnRequestRepository returnRepository,
                            OrderRepository orderRepository,
                            CustomerRepository customerRepository,
                            NotificationRepository notificationRepository) {
        this.returnRepository = returnRepository;
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.notificationRepository = notificationRepository;
    }

    private Optional<Customer> customerFromToken(String token) {
        if (token == null || token.isBlank()) return Optional.empty();
        return customerRepository.findByToken(token);
    }

    private boolean isAdmin(String token) {
        return adminToken != null && !adminToken.isBlank() && adminToken.equals(token);
    }

    private void notify(String title, String body) {
        Notification n = new Notification();
        n.setTitle(title);
        n.setBody(body);
        n.setDate(LocalDate.now().toString());
        n.setRead(false);
        notificationRepository.save(n);
    }

    @PostMapping("/api/returns")
    public ResponseEntity<?> createReturn(
            @RequestHeader(value = "X-Customer-Token", required = false) String token,
            @RequestBody Map<String, Object> body) {

        Optional<Customer> customerOpt = customerFromToken(token);
        if (customerOpt.isEmpty()) return ResponseEntity.status(401).body("Invalid customer token");
        Customer customer = customerOpt.get();

        if (body.get("orderId") == null) return ResponseEntity.badRequest().body("orderId is required");
        Long orderId;
        try {
            orderId = Long.valueOf(String.valueOf(body.get("orderId")));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("orderId must be a number");
        }

        Optional<CustomerOrder> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) return ResponseEntity.notFound().build();
        CustomerOrder order = orderOpt.get();

        if (!customer.getCustomerCode().equals(order.getCustomerId())) {
            return ResponseEntity.status(403).body("This order does not belong to you.");
        }
        if (!"delivered".equals(order.getStatus())) {
            return ResponseEntity.badRequest().body("Only delivered orders can be returned or exchanged.");
        }

        String actionType = String.valueOf(body.getOrDefault("actionType", "")).trim().toLowerCase();
        if (!ALLOWED_ACTIONS.contains(actionType)) {
            return ResponseEntity.badRequest().body("actionType must be return or exchange");
        }

        String reason = String.valueOf(body.getOrDefault("reason", "")).trim();
        if (reason.isEmpty()) return ResponseEntity.badRequest().body("Please choose a reason");
        if (reason.length() > 200) reason = reason.substring(0, 200);

        boolean hasOpen = returnRepository.findByOrderId(orderId).stream()
                .anyMatch(r -> "submitted".equals(r.getStatus()));
        if (hasOpen) {
            return ResponseEntity.badRequest().body("A request for this order is already waiting for review.");
        }

        String details = String.valueOf(body.getOrDefault("details", "")).trim();
        if (details.length() > 1000) details = details.substring(0, 1000);

        String photoBase64 = body.get("photoBase64") == null ? null : String.valueOf(body.get("photoBase64"));
        if (photoBase64 != null && photoBase64.isBlank()) photoBase64 = null;
        if (photoBase64 != null && photoBase64.length() > 4_000_000) {
            return ResponseEntity.badRequest().body("Photo is too large. Please choose a smaller photo.");
        }
        String photoType = String.valueOf(body.getOrDefault("photoType", "image/jpeg"));

        ReturnRequest r = new ReturnRequest();
        r.setOrderId(orderId);
        r.setOrderCode(order.getOrderCode());
        r.setCustomerId(customer.getCustomerCode());
        r.setActionType(actionType);
        r.setReason(reason);
        r.setDetails(details);
        r.setPhotoBase64(photoBase64);
        r.setPhotoType(photoType);
        r.setStatus("submitted");
        r.setRequestDate(LocalDate.now().toString());
        r.setRequestedAt(LocalDateTime.now());

        ReturnRequest saved = returnRepository.save(r);

        notify("Return request received",
                "Your " + actionType + " request for order " + saved.getOrderCode()
                        + " was submitted and is waiting for shop review.");

        return ResponseEntity.ok(view(saved, null));
    }

    @GetMapping("/api/returns/mine")
    public ResponseEntity<?> mine(
            @RequestHeader(value = "X-Customer-Token", required = false) String token) {
        Optional<Customer> customer = customerFromToken(token);
        if (customer.isEmpty()) return ResponseEntity.status(401).body("Invalid customer token");

        List<Map<String, Object>> out = returnRepository
                .findByCustomerIdOrderByIdDesc(customer.get().getCustomerCode())
                .stream().map(r -> view(r, null)).collect(Collectors.toList());
        return ResponseEntity.ok(out);
    }

    @GetMapping("/api/returns/{id}/photo")
    public ResponseEntity<byte[]> photo(@PathVariable Long id) {
        Optional<ReturnRequest> found = returnRepository.findById(id);
        if (found.isEmpty() || found.get().getPhotoBase64() == null) {
            return ResponseEntity.notFound().build();
        }
        try {
            byte[] bytes = Base64.getDecoder().decode(found.get().getPhotoBase64());
            MediaType type = MediaType.IMAGE_JPEG;
            try {
                type = MediaType.parseMediaType(found.get().getPhotoType());
            } catch (Exception ignored) {
            }
            return ResponseEntity.ok().contentType(type).body(bytes);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/api/admin/returns")
    public ResponseEntity<?> all(
            @RequestHeader(value = "X-Admin-Token", required = false) String token) {
        if (!isAdmin(token)) return ResponseEntity.status(401).body("Admin password is wrong or missing.");

        Map<String, Customer> customers = customerRepository.findAll().stream()
                .collect(Collectors.toMap(Customer::getCustomerCode, c -> c, (a, b) -> a));

        List<Map<String, Object>> out = returnRepository.findAll().stream()
                .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
                .map(r -> view(r, r.getCustomerId() == null ? null : customers.get(r.getCustomerId())))
                .collect(Collectors.toList());
        return ResponseEntity.ok(out);
    }

    @PutMapping("/api/admin/returns/{id}/decision")
    public ResponseEntity<?> decide(
            @RequestHeader(value = "X-Admin-Token", required = false) String token,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        if (!isAdmin(token)) return ResponseEntity.status(401).body("Admin password is wrong or missing.");

        Optional<ReturnRequest> found = returnRepository.findById(id);
        if (found.isEmpty()) return ResponseEntity.notFound().build();

        ReturnRequest r = found.get();
        if (!"submitted".equals(r.getStatus())) {
            return ResponseEntity.badRequest().body("This request was already decided.");
        }

        String decision = String.valueOf(body.getOrDefault("decision", "")).trim().toLowerCase();
        if (!ALLOWED_DECISIONS.contains(decision)) {
            return ResponseEntity.badRequest().body("decision must be approved or rejected");
        }
        String note = String.valueOf(body.getOrDefault("note", "")).trim();

        r.setStatus(decision);
        r.setAdminNote(note.isEmpty() ? null : note);
        r.setDecidedAt(LocalDateTime.now());
        ReturnRequest saved = returnRepository.save(r);

        String label = "return".equals(r.getActionType()) ? "Return" : "Exchange";
        notify(label + ("approved".equals(decision) ? " approved" : " rejected"),
                "Your " + label.toLowerCase() + " request for order " + saved.getOrderCode()
                        + " was " + decision + " by the shop."
                        + (note.isEmpty() ? "" : " Note: " + note));

        return ResponseEntity.ok(view(saved, null));
    }

    private Map<String, Object> view(ReturnRequest r, Customer c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("orderId", r.getOrderId());
        m.put("orderCode", r.getOrderCode());
        m.put("customerId", r.getCustomerId());
        m.put("customerName", c == null ? null : c.getName());
        m.put("customerPhone", c == null ? null : c.getPhone());
        m.put("actionType", r.getActionType());
        m.put("reason", r.getReason());
        m.put("details", r.getDetails());
        m.put("hasPhoto", r.getPhotoBase64() != null);
        m.put("photoUrl", r.getPhotoBase64() == null ? null : "/api/returns/" + r.getId() + "/photo");
        m.put("status", r.getStatus());
        m.put("adminNote", r.getAdminNote());
        m.put("requestDate", r.getRequestDate());
        m.put("requestedAt", r.getRequestedAt() == null ? null : r.getRequestedAt().toString());
        m.put("decidedAt", r.getDecidedAt() == null ? null : r.getDecidedAt().toString());
        return m;
    }
}