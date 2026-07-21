package com.hrms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trainings")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Training {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category;            // techinical,soft skills,compliance,leadership
    private String trainer;
    private String mode;               //online,offline,hybrid
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer durationHours;

    private Integer maxParticipants;
    private String venue;
    private String meetingLink;

    @Enumerated(EnumType.STRING)
    private TrainingStatus status;

    @OneToMany(mappedBy = "training", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TrainingEnrollment> enrollments = new ArrayList<>();

    private LocalDateTime createdAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum TrainingStatus { UPCOMING, ONGOING, COMPLETED, CANCELLED }
}
