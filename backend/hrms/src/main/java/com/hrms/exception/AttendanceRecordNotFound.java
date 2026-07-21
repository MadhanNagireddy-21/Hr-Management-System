package com.hrms.exception;

public class AttendanceRecordNotFound extends RuntimeException {
    public AttendanceRecordNotFound(String message) {
        super(message);
    }
    public AttendanceRecordNotFound() {
        super("No attendance record found for today — please check in first");
    }
}