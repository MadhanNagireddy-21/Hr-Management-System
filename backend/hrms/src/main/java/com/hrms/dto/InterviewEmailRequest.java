package com.hrms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterviewEmailRequest {
    private String candidateName;
    private String recipientEmail;
    private String jobTitle;
    private String interviewDate;
    private String interviewTime;

    // For Online Interview
    private String platform;
    private String meetingLink;
    private String meetingId;
    private String passcode;

    // For Offline Interview
    private String venueAddress;
    private String cityLocation;
    private Integer reportingTimeMinutes;
}