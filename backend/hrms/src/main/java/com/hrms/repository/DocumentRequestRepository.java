package com.hrms.repository;

import com.hrms.entity.DocumentRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentRequestRepository extends JpaRepository<DocumentRequest, Long> {

    boolean existsByEmail(String email);
}