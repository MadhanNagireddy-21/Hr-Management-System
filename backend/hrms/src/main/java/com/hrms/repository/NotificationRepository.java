package com.hrms.repository;

import com.hrms.entity.Employee;
import com.hrms.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByRecipient(Employee recipient, Pageable pageable);
    Page<Notification> findByRecipientAndIsReadFalse(Employee recipient, Pageable pageable);
    long countByRecipientAndIsReadFalse(Employee recipient);
}