package com.hrms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendGreetingRequest {
    private String candidateName;
    private String recipientEmail;
    private Integer templateId;
    private Integer adminId;
    private String adminName;
}