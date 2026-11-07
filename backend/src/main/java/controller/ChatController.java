package com.mobileshop.backend.controller;

import com.mobileshop.backend.model.ChatMessage;
import com.mobileshop.backend.model.Customer;
import com.mobileshop.backend.model.Notification;
import com.mobileshop.backend.repository.ChatMessageRepository;
import com.mobileshop.backend.repository.CustomerRepository;
import com.mobileshop.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
public class ChatController {

    private final ChatMessageRepository chatRepository;
    private final CustomerRepository customerRepository;
    private final NotificationRepository notificationRepository;

    @Value("${admin.api.token:}")
    private String adminToken;

    public ChatController(ChatMessageRepository chatRepository,
                          CustomerRepository customerRepository,
                          NotificationRepository notificationRepository) {
        this.chatRepository = chatRepository;
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

    private String botReply(String text) {
        String lower = text.toLowerCase();
        if (lower.contains("deliver") || lower.contains("arrive") || lower.contains("shipping") || lower.contains("when"))
            return "Orders are delivered in 2-4 working days. Check My Orders for live status.";
        if (lower.contains("return") || lower.contains("replace") || lower.contains("refund") || lower.contains("broken") || lower.contains("damage"))
            return "You can request a return or exchange within 7 days of delivery from your order details.";
        if (lower.contains("pay") || lower.contains("upi") || lower.contains("card") || lower.contains("cash"))
            return "We accept Cash on Delivery, UPI and debit/credit cards.";
        if (lower.contains("stock") || lower.contains("available"))
            return "If you can see the product in the app, it is in stock.";
        if (lower.contains("cancel"))
            return "You can cancel from My Orders while the order is still placed.";
        if (lower.contains("hello") || lower.equals("hi") || lower.contains("hey"))
            return "Hello! How can I help you today?";
        if (lower.contains("price") || lower.contains("cost") || lower.contains("how much"))
            return "Please check the price on the Home screen. It is the live price from the shop.";
        return null;
    }

    private Map<String, Object> view(ChatMessage m) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", m.getId());
        out.put("customerId", m.getCustomerId());
        out.put("sender", m.getSender());
        out.put("text", m.getText());
        out.put("createdAt", m.getCreatedAt() == null ? null : m.getCreatedAt().toString());
        return out;
    }

    // ---------- customer: send ----------
    @PostMapping("/api/chat/send")
    public ResponseEntity<?> send(
            @RequestHeader(value = "X-Customer-Token", required = false) String token,
            @RequestBody Map<String, String> body) {

        Optional<Customer> customerOpt = customerFromToken(token);
        if (customerOpt.isEmpty()) return ResponseEntity.status(401).body("Invalid customer token");

        String text = body.getOrDefault("text", "").trim();
        if (text.isEmpty()) return ResponseEntity.badRequest().body("Message is empty");
        if (text.length() > 2000) text = text.substring(0, 2000);

        Customer customer = customerOpt.get();

        ChatMessage userMsg = new ChatMessage();
        userMsg.setCustomerId(customer.getCustomerCode());
        userMsg.setSender("customer");
        userMsg.setText(text);
        userMsg.setCreatedAt(LocalDateTime.now());
        userMsg.setReadByAdmin(false);
        ChatMessage savedUser = chatRepository.save(userMsg);

        List<Map<String, Object>> out = new ArrayList<>();
        out.add(view(savedUser));

        String auto = botReply(text);
        if (auto != null) {
            ChatMessage botMsg = new ChatMessage();
            botMsg.setCustomerId(customer.getCustomerCode());
            botMsg.setSender("bot");
            botMsg.setText(auto);
            botMsg.setCreatedAt(LocalDateTime.now());
            botMsg.setReadByAdmin(true);
            out.add(view(chatRepository.save(botMsg)));
        }

        return ResponseEntity.ok(out);
    }

    // ---------- customer: history ----------
    @GetMapping("/api/chat/mine")
    public ResponseEntity<?> mine(
            @RequestHeader(value = "X-Customer-Token", required = false) String token) {
        Optional<Customer> customer = customerFromToken(token);
        if (customer.isEmpty()) return ResponseEntity.status(401).body("Invalid customer token");
        List<Map<String, Object>> out = chatRepository
                .findByCustomerIdOrderByIdAsc(customer.get().getCustomerCode())
                .stream().map(this::view).collect(Collectors.toList());
        return ResponseEntity.ok(out);
    }

    // ---------- admin: list conversations ----------
    @GetMapping("/api/admin/chat/customers")
    public ResponseEntity<?> chatCustomers(
            @RequestHeader(value = "X-Admin-Token", required = false) String token) {
        if (!isAdmin(token)) return ResponseEntity.status(401).body("Admin password is wrong or missing.");

        Map<String, Customer> customers = customerRepository.findAll().stream()
                .collect(Collectors.toMap(Customer::getCustomerCode, c -> c, (a, b) -> a));

        List<Map<String, Object>> out = new ArrayList<>();
        for (String cid : chatRepository.findDistinctCustomerIds()) {
            List<ChatMessage> msgs = chatRepository.findByCustomerIdOrderByIdAsc(cid);
            if (msgs.isEmpty()) continue;
            ChatMessage last = msgs.get(msgs.size() - 1);
            long unread = msgs.stream()
                    .filter(m -> "customer".equals(m.getSender()) && !m.isReadByAdmin())
                    .count();
            Customer c = customers.get(cid);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("customerId", cid);
            m.put("customerName", c == null ? null : c.getName());
            m.put("customerPhone", c == null ? null : c.getPhone());
            m.put("lastMessage", last.getText());
            m.put("lastAt", last.getCreatedAt() == null ? null : last.getCreatedAt().toString());
            m.put("lastSender", last.getSender());
            m.put("unread", unread);
            m.put("total", msgs.size());
            out.add(m);
        }
        out.sort((a, b) -> String.valueOf(b.get("lastAt")).compareTo(String.valueOf(a.get("lastAt"))));
        return ResponseEntity.ok(out);
    }

    // ---------- admin: read conversation (marks as read) ----------
    @GetMapping("/api/admin/chat/{customerId}")
    public ResponseEntity<?> chatHistory(
            @RequestHeader(value = "X-Admin-Token", required = false) String token,
            @PathVariable String customerId) {
        if (!isAdmin(token)) return ResponseEntity.status(401).body("Admin password is wrong or missing.");

        List<ChatMessage> msgs = chatRepository.findByCustomerIdOrderByIdAsc(customerId);
        List<ChatMessage> toMark = msgs.stream()
                .filter(m -> "customer".equals(m.getSender()) && !m.isReadByAdmin())
                .peek(m -> m.setReadByAdmin(true))
                .collect(Collectors.toList());
        if (!toMark.isEmpty()) chatRepository.saveAll(toMark);

        return ResponseEntity.ok(msgs.stream().map(this::view).collect(Collectors.toList()));
    }

    // ---------- admin: reply ----------
    @PostMapping("/api/admin/chat/{customerId}/reply")
    public ResponseEntity<?> reply(
            @RequestHeader(value = "X-Admin-Token", required = false) String token,
            @PathVariable String customerId,
            @RequestBody Map<String, String> body) {
        if (!isAdmin(token)) return ResponseEntity.status(401).body("Admin password is wrong or missing.");

        String text = body.getOrDefault("text", "").trim();
        if (text.isEmpty()) return ResponseEntity.badRequest().body("Reply is empty");
        if (text.length() > 2000) text = text.substring(0, 2000);

        ChatMessage reply = new ChatMessage();
        reply.setCustomerId(customerId);
        reply.setSender("admin");
        reply.setText(text);
        reply.setCreatedAt(LocalDateTime.now());
        reply.setReadByAdmin(true);
        ChatMessage saved = chatRepository.save(reply);

        notify("New message from shop", text.length() > 80 ? text.substring(0, 80) + "..." : text);

        return ResponseEntity.ok(view(saved));
    }
}