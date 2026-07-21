package com.hrms.dto;

import com.hrms.entity.Training.TrainingStatus;
import com.hrms.entity.TrainingEnrollment.EnrollmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class TrainingDTOs {

    @Data
    public static class CreateRequest {
        @NotBlank private String title;
        private String description;
        @NotBlank private String category;
        private String trainer;
        private String mode;
        @NotNull  private LocalDate startDate;
        @NotNull  private LocalDate endDate;
        private Integer durationHours;
        private Integer maxParticipants;
        private String venue;
        private String meetingLink;
    }

    @Data
    public static class UpdateRequest {
        private String title;
        private String description;
        private String trainer;
        private String mode;
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer durationHours;
        private Integer maxParticipants;
        private String venue;
        private String meetingLink;
        private TrainingStatus status;
    }

    @Data
    public static class Response {
        private Long id;
        private String title;
        private String description;
        private String category;
        private String trainer;
        private String mode;
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer durationHours;
        private Integer maxParticipants;
        private int enrolledCount;
        private String venue;
        private String meetingLink;
        private TrainingStatus status;
        private LocalDateTime createdAt;
    }

    @Data
    public static class EnrollRequest {
        @NotNull private Long employeeId;
    }

    @Data
    public static class CompleteRequest {
        private Integer score;
        private String certificateUrl;
        private String feedback;
    }

    @Data
    public static class EnrollmentResponse {
        private Long id;
        private Long trainingId;
        private String trainingTitle;
        private Long employeeId;
        private String employeeName;
        private EnrollmentStatus status;
        private Boolean completed;
        private Integer score;
        private String feedback;
        private LocalDateTime enrolledAt;
        private LocalDateTime completedAt;
    }
}
