package com.hrms.entity;

import com.hrms.enums.DocumentRequestStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "document_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String candidateName;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String jobTitle;

    private LocalDate interviewDate;

    @Column(nullable = false)
    private LocalDate submissionDeadline;

    private Long adminId;

    private String adminName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentRequestStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime lastSentAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.lastSentAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = DocumentRequestStatus.PENDING;
        }
    }
}