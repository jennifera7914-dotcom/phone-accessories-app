package com.mobileshop.backend.controller;

import com.mobileshop.backend.model.CustomerOrder;
import com.mobileshop.backend.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/admin/sales")
public class SalesReportController {

    private final OrderRepository orderRepository;

    private static final Pattern QTY_PATTERN =
            Pattern.compile("[x×]\\s*(\\d+)");

    @Value("${admin.api.token:}")
    private String adminToken;

    public SalesReportController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    private boolean isAdmin(String token) {
        return adminToken != null
                && !adminToken.isBlank()
                && adminToken.equals(token);
    }

    private int countProducts(CustomerOrder order) {
        String items = order.getItems();

        if (items == null || items.isBlank()) {
            return 0;
        }

        int total = 0;
        Matcher matcher = QTY_PATTERN.matcher(items);

        while (matcher.find()) {
            try {
                total += Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException ignored) {
                // Ignore invalid quantity values.
            }
        }

        return total;
    }

    @GetMapping
    public ResponseEntity<?> getSalesReport(
            @RequestHeader(value = "X-Admin-Token", required = false)
            String token,
            @RequestParam int year) {

        if (!isAdmin(token)) {
            return ResponseEntity.status(401)
                    .body("Admin token required");
        }

        if (year < 2000 || year > 2100) {
            return ResponseEntity.badRequest()
                    .body("Invalid year");
        }

        int[] placed = new int[12];
        int[] delivered = new int[12];
        int[] cancelled = new int[12];

        List<CustomerOrder> orders = orderRepository.findAll();

        for (CustomerOrder order : orders) {

            if (order.getOrderDate() == null) {
                continue;
            }

            LocalDate date;

            try {
                date = LocalDate.parse(order.getOrderDate());
            } catch (Exception ignored) {
                continue;
            }

            if (date.getYear() != year) {
                continue;
            }

            int monthIndex = date.getMonthValue() - 1;
            int quantity = countProducts(order);

            String status = order.getStatus();

            if ("placed".equalsIgnoreCase(status)) {
                placed[monthIndex] += quantity;

            } else if ("delivered".equalsIgnoreCase(status)) {
                delivered[monthIndex] += quantity;

            } else if ("cancelled".equalsIgnoreCase(status)) {
                cancelled[monthIndex] += quantity;
            }
        }

        String[] monthNames = {
                "January", "February", "March", "April",
                "May", "June", "July", "August",
                "September", "October", "November", "December"
        };

        List<Map<String, Object>> monthly = new ArrayList<>();

        int placedTotal = 0;
        int deliveredTotal = 0;
        int cancelledTotal = 0;

        for (int i = 0; i < 12; i++) {

            Map<String, Object> month = new LinkedHashMap<>();

            month.put("month", monthNames[i]);
            month.put("monthNumber", i + 1);
            month.put("placedProducts", placed[i]);
            month.put("deliveredProducts", delivered[i]);
            month.put("cancelledProducts", cancelled[i]);

            monthly.add(month);

            placedTotal += placed[i];
            deliveredTotal += delivered[i];
            cancelledTotal += cancelled[i];
        }

        Map<String, Object> report = new LinkedHashMap<>();

        report.put("year", year);
        report.put("placedTotal", placedTotal);
        report.put("deliveredTotal", deliveredTotal);
        report.put("cancelledTotal", cancelledTotal);
        report.put("monthly", monthly);

        return ResponseEntity.ok(report);
    }
}