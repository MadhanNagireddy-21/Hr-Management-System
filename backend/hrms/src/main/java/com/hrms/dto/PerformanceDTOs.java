package com.hrms.dto;

import com.hrms.entity.PerformanceReview.ReviewStatus;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class PerformanceDTOs {

    @Data
    public static class CreateRequest {
        @NotNull  private Long employeeId;
        @NotBlank private String reviewPeriod;
        @NotNull  private LocalDate reviewDate;
        @Min(1) @Max(5) private Integer technicalSkills;
        @Min(1) @Max(5) private Integer communication;
        @Min(1) @Max(5) private Integer teamwork;
        @Min(1) @Max(5) private Integer productivity;
        @Min(1) @Max(5) private Integer leadership;
        private String strengths;
        private String improvements;
        private String goals;
    }

    @Data
    public static class UpdateRequest {
        @Min(1) @Max(5) private Integer technicalSkills;
        @Min(1) @Max(5) private Integer communication;
        @Min(1) @Max(5) private Integer teamwork;
        @Min(1) @Max(5) private Integer productivity;
        @Min(1) @Max(5) private Integer leadership;
        private String strengths;
        private String improvements;
        private String goals;
        private ReviewStatus status;
    }

    @Data
    public static class AcknowledgeRequest {
        private String employeeComments;
    }

    @Data
    public static class Response {
        private Long id;
        private Long employeeId;
        private String employeeName;
        private String employeeCode;
        private String reviewerName;
        private String reviewPeriod;
        private LocalDate reviewDate;
        private Integer technicalSkills;
        private Integer communication;
        private Integer teamwork;
        private Integer productivity;
        private Integer leadership;
        private Double overallRating;
        private ReviewStatus status;
        private String strengths;
        private String improvements;
        private String goals;
        private String employeeComments;
        private LocalDateTime createdAt;
    }
}
