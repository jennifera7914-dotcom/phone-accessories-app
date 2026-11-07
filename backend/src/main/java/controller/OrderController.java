package com.mobileshop.backend.controller;

import com.mobileshop.backend.model.Customer;
import com.mobileshop.backend.model.CustomerOrder;
import com.mobileshop.backend.model.Notification;
import com.mobileshop.backend.model.OrderStatusHistory;
import com.mobileshop.backend.model.Product;
import com.mobileshop.backend.repository.CustomerRepository;
import com.mobileshop.backend.repository.NotificationRepository;
import com.mobileshop.backend.repository.OrderRepository;
import com.mobileshop.backend.repository.OrderStatusHistoryRepository;
import com.mobileshop.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    // Simplified flow: placed -> delivered (or cancelled while still placed)
    private static final Set<String> ALLOWED_STATUSES = Set.of("placed", "delivered", "cancelled");
    private static final Pattern QTY_PATTERN = Pattern.compile("[x×]\\s*(\\d+)");

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository historyRepository;
    private final NotificationRepository notificationRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;

    @Value("${admin.api.token:}")
    private String adminToken;

    public OrderController(OrderRepository orderRepository,
                           OrderStatusHistoryRepository historyRepository,
                           NotificationRepository notificationRepository,
                           CustomerRepository customerRepository,
                           ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.historyRepository = historyRepository;
        this.notificationRepository = notificationRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
    }

    // ---------- helpers ----------

    private Optional<Customer> customerFromToken(String token) {
        if (token == null || token.isBlank()) return Optional.empty();
        return customerRepository.findByToken(token);
    }

    private boolean isAdmin(String token) {
        return adminToken != null && !adminToken.isBlank() && adminToken.equals(token);
    }

    private void recordHistory(CustomerOrder order, String status, String note, String changedBy) {
        OrderStatusHistory h = new OrderStatusHistory();
        h.setOrderId(order.getId());
        h.setStatus(status);
        h.setNote(note);
        h.setChangedBy(changedBy);
        h.setChangedAt(LocalDateTime.now());
        historyRepository.save(h);
    }

    private void notify(String customerId, String title, String body) {
        Notification n = new Notification();
        n.setCustomerId(customerId);
        n.setTitle(title);
        n.setBody(body);
        n.setDate(LocalDate.now().toString());
        n.setRead(false);
        notificationRepository.save(n);
    }

    private int countItems(String items) {
        if (items == null) return 0;
        int total = 0;
        Matcher m = QTY_PATTERN.matcher(items);
        while (m.find()) {
            try { total += Integer.parseInt(m.group(1)); } catch (NumberFormatException ignored) { }
        }
        return total;
    }

    private String jsonEscape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private int toInt(Object o, int fallback) {
        try { return (int) Double.parseDouble(String.valueOf(o)); } catch (Exception e) { return fallback; }
    }

    private Long toLong(Object o) {
        try { return (long) Double.parseDouble(String.valueOf(o)); } catch (Exception e) { return null; }
    }

    // ---------- customer: my orders ----------

    @GetMapping("/mine")
    public ResponseEntity<?> getMyOrders(
            @RequestHeader(value = "X-Customer-Token", required = false) String token) {
        Optional<Customer> customer = customerFromToken(token);
        if (customer.isEmpty()) return ResponseEntity.status(401).body("Invalid customer token");
        return ResponseEntity.ok(
                orderRepository.findByCustomerIdOrderByIdDesc(customer.get().getCustomerCode()));
    }

    // ---------- customer: month / year summary ----------

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(
            @RequestHeader(value = "X-Customer-Token", required = false) String token,
            @RequestParam int year,
            @RequestParam(required = false) Integer month) {

        Optional<Customer> customer = customerFromToken(token);
        if (customer.isEmpty()) return ResponseEntity.status(401).body("Invalid customer token");

        List<CustomerOrder> orders =
                orderRepository.findByCustomerIdOrderByIdDesc(customer.get().getCustomerCode());

        int totalOrders = 0, cancelled = 0, delivered = 0, itemsSold = 0;
        double amount = 0;

        for (CustomerOrder o : orders) {
            if (o.getOrderDate() == null) continue;
            LocalDate d;
            try { d = LocalDate.parse(o.getOrderDate()); } catch (Exception e) { continue; }
            if (d.getYear() != year) continue;
            if (month != null && d.getMonthValue() != month) continue;

            totalOrders++;
            if ("cancelled".equals(o.getStatus())) {
                cancelled++;
            } else {
                amount += o.getTotal() != null ? o.getTotal() : 0;
                itemsSold += countItems(o.getItems());
                if ("delivered".equals(o.getStatus())) delivered++;
            }
        }

        Map<String, Object> out = new HashMap<>();
        out.put("year", year);
        out.put("month", month);
        out.put("totalOrders", totalOrders);
        out.put("cancelledOrders", cancelled);
        out.put("deliveredOrders", delivered);
        out.put("totalItems", itemsSold);
        out.put("totalAmount", Math.round(amount));
        return ResponseEntity.ok(out);
    }

    // ---------- customer: place order ----------
    // Body: { "items": [ { "productId": 1, "quantity": 2 }, ... ] }
    // Prices, address and order number all come from the database, never from the phone.

    @PostMapping
    public ResponseEntity<?> createOrder(
            @RequestHeader(value = "X-Customer-Token", required = false) String token,
            @RequestBody Map<String, Object> body) {

        Optional<Customer> customerOpt = customerFromToken(token);
        if (customerOpt.isEmpty()) return ResponseEntity.status(401).body("Invalid customer token");
        Customer customer = customerOpt.get();

        if (!customer.isAddressSavedByAdmin()) {
            return ResponseEntity.badRequest().body("Your delivery address is not saved yet. Please contact the shop.");
        }

        Object raw = body.get("items");
        if (!(raw instanceof List) || ((List<?>) raw).isEmpty()) {
            return ResponseEntity.badRequest().body("No items in the order.");
        }

        double total = 0;
        StringBuilder text = new StringBuilder();
        StringBuilder json = new StringBuilder("[");
        boolean first = true;

        for (Object entry : (List<?>) raw) {
            if (!(entry instanceof Map)) continue;
            Map<?, ?> item = (Map<?, ?>) entry;

            Long productId = toLong(item.get("productId"));
            int qty = Math.max(1, Math.min(999, toInt(item.get("quantity"), 1)));
            if (productId == null) {
                return ResponseEntity.badRequest().body("One item in your cart is no longer sold. Please remove it and try again.");
            }

            Optional<Product> pOpt = productRepository.findById(productId);
            if (pOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("A product in your cart is no longer available.");
            }
            Product p = pOpt.get();
            if (p.getStock() != null && p.getStock() < qty) {
                return ResponseEntity.badRequest().body("Only " + p.getStock() + " left of " + p.getName() + ".");
            }

            double price = p.getPrice() != null ? p.getPrice() : 0;
            total += price * qty;

            if (!first) { text.append(", "); json.append(","); }
            first = false;

            text.append(p.getName()).append(" ×").append(qty);
            json.append("{\"productId\":").append(p.getId())
                .append(",\"name\":\"").append(jsonEscape(p.getName()))
                .append("\",\"variant\":\"").append(jsonEscape(p.getVariant()))
                .append("\",\"price\":").append(price)
                .append(",\"quantity\":").append(qty)
                .append(",\"icon\":\"").append(jsonEscape(p.getIcon())).append("\"}");
        }
        json.append("]");

        if (first) return ResponseEntity.badRequest().body("No valid items in the order.");

        String address = customer.getAddressLine() + ", " + customer.getCity()
                + (customer.getState() != null && !customer.getState().isBlank() ? ", " + customer.getState() : "")
                + " - " + customer.getPincode();

        CustomerOrder order = new CustomerOrder();
        order.setOrderCode("PENDING");
        order.setStatus("placed");
        order.setTotal(Math.round(total * 100.0) / 100.0);
        order.setItems(text.toString());
        order.setItemsJson(json.toString());
        order.setAddress(address);
        order.setPaymentMethod("Settled directly with the shop");
        order.setOrderDate(LocalDate.now().toString());
        order.setPlacedAt(LocalDateTime.now().toString());
        order.setCustomerId(customer.getCustomerCode());

        CustomerOrder saved = orderRepository.save(order);

        // Unique, readable order number built from the database id: ORD-20261103-0007
        String code = "ORD-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-" + String.format("%04d", saved.getId());
        saved.setOrderCode(code);
        saved = orderRepository.save(saved);

        recordHistory(saved, "placed", "Order placed", "customer");
        notify(customer.getCustomerCode(), "Order placed", "Order " + code + " placed. Total: Rs." + saved.getTotal() + ".");

        return ResponseEntity.ok(saved);
    }

    // ---------- read ----------

    @GetMapping
    public ResponseEntity<?> getAllOrders(
            @RequestHeader(value = "X-Admin-Token", required = false) String adminHeader) {
        if (!isAdmin(adminHeader)) return ResponseEntity.status(401).body("Admin token required");
        List<CustomerOrder> orders = orderRepository.findAll();
        Collections.reverse(orders);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<?> getHistory(
            @RequestHeader(value = "X-Customer-Token", required = false) String token,
            @RequestHeader(value = "X-Admin-Token", required = false) String adminHeader,
            @PathVariable Long id) {

        Optional<CustomerOrder> found = orderRepository.findById(id);
        if (found.isEmpty()) return ResponseEntity.notFound().build();

        boolean allowed = isAdmin(adminHeader);
        if (!allowed) {
            Optional<Customer> c = customerFromToken(token);
            allowed = c.isPresent() && c.get().getCustomerCode().equals(found.get().getCustomerId());
        }
        if (!allowed) return ResponseEntity.status(403).body("Not your order");

        return ResponseEntity.ok(historyRepository.findByOrderIdOrderByChangedAtAsc(id));
    }

    // ---------- customer cancel (only while still placed) ----------

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(
            @RequestHeader(value = "X-Customer-Token", required = false) String token,
            @PathVariable Long id) {

        Optional<Customer> customer = customerFromToken(token);
        if (customer.isEmpty()) return ResponseEntity.status(401).body("Invalid customer token");

        Optional<CustomerOrder> found = orderRepository.findById(id);
        if (found.isEmpty()) return ResponseEntity.notFound().build();

        CustomerOrder order = found.get();
        if (!customer.get().getCustomerCode().equals(order.getCustomerId())) {
            return ResponseEntity.status(403).body("Not your order");
        }
        if (!"placed".equals(order.getStatus())) {
            return ResponseEntity.badRequest().body("Only orders that are still placed can be cancelled");
        }

        order.setStatus("cancelled");
        CustomerOrder saved = orderRepository.save(order);
        recordHistory(saved, "cancelled", "Cancelled by customer", "customer");
        notify(saved.getCustomerId(), "Order cancelled", "Order " + saved.getOrderCode() + " has been cancelled.");
        return ResponseEntity.ok(saved);
    }
}
