package com.hrms.enums;
public enum EmailStatus {
    SENT("Sent"),
    FAILED("Failed"),
    PENDING("Pending");

    private final String displayName;

    EmailStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}