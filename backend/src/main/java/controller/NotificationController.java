package com.mobileshop.backend.controller;

import com.mobileshop.backend.model.Notification;
import com.mobileshop.backend.repository.NotificationRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository repo;

    public NotificationController(NotificationRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Notification> getAll() {
        List<Notification> list = repo.findAll();
        Collections.reverse(list);
        return list;
    }

    @PostMapping
    public Notification add(@RequestBody Notification n) {
        return repo.save(n);
    }

    @PutMapping("/{id}/read")
    public Notification markRead(@PathVariable Long id) {
        Notification n = repo.findById(id).orElseThrow();
        n.setRead(true);
        return repo.save(n);
    }

    @PutMapping("/mark-all-read")
    public List<Notification> markAllRead() {
        List<Notification> all = repo.findAll();
        for (Notification n : all) {
            n.setRead(true);
        }
        return repo.saveAll(all);
    }
}