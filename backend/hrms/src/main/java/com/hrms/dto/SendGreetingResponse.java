package com.hrms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendGreetingResponse {
    private Boolean success;
    private String message;
    private Integer emailHistoryId;

    public SendGreetingResponse(Boolean success, String message) {
        this.success = success;
        this.message = message;
    }
}