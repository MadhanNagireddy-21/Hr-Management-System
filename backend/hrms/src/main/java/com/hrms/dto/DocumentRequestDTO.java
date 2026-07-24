package com.hrms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentRequestDTO {

    private String candidateName;

    private String email;

    private String jobTitle;

    // Comes from the frontend <input type="date"> as "yyyy-MM-dd"
    private LocalDate interviewDate;

    // Comes from the frontend <input type="date"> as "yyyy-MM-dd"
    private LocalDate submissionDeadline;

    private Long adminId;

    private String adminName;

    // If true, HR is explicitly choosing to resend even though a
    // PENDING request already exists for this email.
    private boolean forceResend;
}