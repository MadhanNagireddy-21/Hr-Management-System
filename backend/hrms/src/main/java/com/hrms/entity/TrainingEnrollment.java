package com.hrms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "training_enrollments",
       uniqueConstraints = @UniqueConstraint(columnNames = {"training_id", "employee_id"}))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TrainingEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "training_id", nullable = false)
    private Training training;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    private EnrollmentStatus status;

    private Boolean completed = false;
    private Integer score;                  // post-training assessment score
    private String certificateUrl;
    private String feedback;

    private LocalDateTime enrolledAt;
    private LocalDateTime completedAt;

    @PrePersist protected void onCreate() { enrolledAt = LocalDateTime.now(); }

    public enum EnrollmentStatus { ENROLLED, COMPLETED, DROPPED, FAILED }
}
