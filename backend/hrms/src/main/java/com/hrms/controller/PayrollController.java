package com.hrms.controller;

import com.hrms.dto.ApiResponse;
import com.hrms.dto.PayrollDTOs;
import com.hrms.service.PayrollService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
@Tag(name = "Payroll")
public class PayrollController {

    private final PayrollService payrollService;

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Generate payroll for an employee for a given month/year")
    public ResponseEntity<ApiResponse<PayrollDTOs.Response>> generate(
            @Valid @RequestBody PayrollDTOs.GenerateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payroll generated", payrollService.generatePayroll(request)));
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Get payroll history for an employee")
    public ResponseEntity<ApiResponse<Page<PayrollDTOs.Response>>> getByEmployee(
            @PathVariable Long employeeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(ApiResponse.success("Payroll history",
                payrollService.getByEmployee(employeeId,
                        PageRequest.of(page, size, Sort.by("year", "month").descending()))));
    }

    @PutMapping("/{payrollId}/mark-paid")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Mark a payroll record as paid")
    public ResponseEntity<ApiResponse<PayrollDTOs.Response>> markAsPaid(@PathVariable Long payrollId) {
        return ResponseEntity.ok(ApiResponse.success("Marked as paid", payrollService.markAsPaid(payrollId)));
    }

    @GetMapping("/month")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Get all payroll records for a given month and year")
    public ResponseEntity<ApiResponse<java.util.List<PayrollDTOs.Response>>> getByMonth(
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(ApiResponse.success("Payroll for month",
                payrollService.getByMonth(month, year)));
    }
}