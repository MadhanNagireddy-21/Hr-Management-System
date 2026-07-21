package com.hrms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "onboarding")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Onboarding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false, unique = true)
    private Employee employee;

    private LocalDate joiningDate;

    @Enumerated(EnumType.STRING)
    private OnboardingStatus status;

    // Document checklist
    private Boolean offerLetterSigned     = false;
    private Boolean idProofSubmitted      = false;
    private Boolean addressProofSubmitted = false;
    private Boolean educationDocsSubmitted = false;
    private Boolean bankDetailsSubmitted  = false;
    private Boolean pfFormSubmitted       = false;
    private Boolean esiFormSubmitted      = false;
    private Boolean ndaSigned             = false;
    private Boolean laptopIssued          = false;
    private Boolean emailCreated          = false;
    private Boolean systemAccessGiven     = false;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_hr_id")
    private Employee assignedHr;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist  protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }
    @PreUpdate   protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum OnboardingStatus { PENDING, IN_PROGRESS, COMPLETED }
}
