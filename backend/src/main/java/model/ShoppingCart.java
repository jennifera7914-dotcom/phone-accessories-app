package com.mobileshop.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_cart")
public class ShoppingCart {

    @Id
    private String customerId;

    @Column(length = 20000)
    private String cartItems;

    @Column(length = 20000)
    private String savedItems;

    public ShoppingCart() {
    }

    public ShoppingCart(String customerId, String cartItems, String savedItems) {
        this.customerId = customerId;
        this.cartItems = cartItems;
        this.savedItems = savedItems;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getCartItems() {
        return cartItems;
    }

    public void setCartItems(String cartItems) {
        this.cartItems = cartItems;
    }

    public String getSavedItems() {
        return savedItems;
    }

    public void setSavedItems(String savedItems) {
        this.savedItems = savedItems;
    }
}