package com.hrms.entity;

import com.hrms.enums.EmailStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 255)
    private String candidateName;

    @Column(nullable = false, length = 255)
    private String recipientEmail;

    @Column(nullable = false)
    private Integer sentByAdminId;

    @Column(length = 255)
    private String sentByAdminName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private EmailTemplate emailTemplate;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime sentAt;

    @Enumerated(EnumType.STRING)
    @Column(length = 50, nullable = false)
    private EmailStatus status;

    @Column(columnDefinition = "LONGTEXT")
    private String errorMessage;

    @Column(nullable = false)
    private Boolean isRead = false;
}
// When Admin sends greeting to Ammullu:
// ├─ Who sent it? (Admin name/ID)
// ├─ To whom? (Ammullu's email)
// ├─ When? (Date & time)
// ├─ Which template? (Which greeting template used)
// ├─ Status? (SENT or FAILED)
// └─ Error message? (If failed, why?)