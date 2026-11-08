package com.mobileshop.backend.controller;

import com.mobileshop.backend.model.Product;
import com.mobileshop.backend.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Automatically inserts starter products into MySQL if empty
    @Bean
    CommandLineRunner seedProducts(ProductRepository repo) {
        return args -> {
            if (repo.count() == 0) {
                repo.save(new Product("9H Tempered Glass", "iPhone 13 / 14 / 15", 199.0, 50, "🛡️", "Screen Protectors", "Edge-to-edge full glue tempered glass with oleophobic coating."));
                repo.save(new Product("Braided USB-C Cable", "1 Meter / 65W Fast Charge", 149.0, 100, "🔌", "Cables", "Tangle-free nylon braided Type-C to Type-C cable."));
                repo.save(new Product("Silicone Matte Case", "Samsung S23 / S24", 299.0, 30, "📱", "Cases", "Soft-touch anti-fingerprint liquid silicone protective cover."));
                repo.save(new Product("20W PD Fast Charger", "Type-C Adapter", 499.0, 40, "⚡", "Adapters", "Power Delivery compact wall charger for fast charging."));
                repo.save(new Product("Magnetic Car Phone Mount", "360° Air Vent Clip", 349.0, 25, "🚗", "Mounts", "Strong neodymium magnets suitable for all phone models."));
                repo.save(new Product("Camera Lens Protector", "Aluminium Ring Shield", 129.0, 60, "📸", "Lens Protectors", "Individual metallic scratch-resistant lens caps."));
            }
        };
    }
}