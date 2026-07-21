package com.hrms.exception;

public class EmployeeAlreadyExists extends RuntimeException {
    public EmployeeAlreadyExists(String email) {
        super("Employee with email '" + email + "' already exists");
    }
}