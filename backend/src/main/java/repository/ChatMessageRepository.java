package com.mobileshop.backend.repository;

import com.mobileshop.backend.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByCustomerIdOrderByIdAsc(String customerId);

    List<ChatMessage> findByCustomerIdAndReadByAdminFalse(String customerId);

    @Query("SELECT DISTINCT c.customerId FROM ChatMessage c")
    List<String> findDistinctCustomerIds();
}