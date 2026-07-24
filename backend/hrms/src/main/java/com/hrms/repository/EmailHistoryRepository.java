package com.hrms.repository;

import com.hrms.entity.EmailHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailHistoryRepository extends JpaRepository<EmailHistory, Integer> {

    List<EmailHistory> findBySentByAdminId(Integer adminId);

    List<EmailHistory> findByRecipientEmail(String recipientEmail);

    List<EmailHistory> findByStatus(String status);

    @Query(value = "SELECT * FROM email_history ORDER BY sent_at DESC LIMIT :limit", nativeQuery = true)
    List<EmailHistory> findRecentEmails(@Param("limit") int limit);

    Optional<EmailHistory> findByRecipientEmailAndStatus(String email, String status);
}