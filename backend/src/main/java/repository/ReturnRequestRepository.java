package com.mobileshop.backend.repository;

import com.mobileshop.backend.model.ReturnRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {
    List<ReturnRequest> findByCustomerIdOrderByIdDesc(String customerId);
    List<ReturnRequest> findByOrderId(Long orderId);
}