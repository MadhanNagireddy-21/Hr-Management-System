package com.hrms.enums;

public enum DocumentRequestStatus {
    PENDING, // record created, email not yet confirmed sent
    EMAIL_SENT, // email successfully sent, waiting on candidate
    SUBMITTED, // HR has manually marked documents as received
    EXPIRED // past deadline, no submission
}