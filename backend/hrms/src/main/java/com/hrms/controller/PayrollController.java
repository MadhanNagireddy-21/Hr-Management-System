package com.hrms.controller;

import com.hrms.dto.ApiResponse;
import com.hrms.dto.PayrollDTOs;
import com.hrms.entity.Employee;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
@Tag(name = "Payroll")
public class PayrollController {

    private final PayrollService payrollService;

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Generate payroll for employee")
    public ResponseEntity<ApiResponse<PayrollDTOs.Response>> generate(
            @Valid @RequestBody PayrollDTOs.GenerateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payroll generated", payrollService.generatePayroll(req)));
    }

    @GetMapping("/my")
    @Operation(summary = "Get my payroll history")
    public ResponseEntity<ApiResponse<Page<PayrollDTOs.Response>>> my(
            @AuthenticationPrincipal Employee emp,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(ApiResponse.success("Payroll history",
                payrollService.getMyPayroll(emp.getId(),
                        PageRequest.of(page, size, Sort.by("year", "month").descending()))));
    }

    @GetMapping("/month")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Get all payroll for a month")
    public ResponseEntity<ApiResponse<List<PayrollDTOs.Response>>> monthly(
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(ApiResponse.success("Monthly payroll",
                payrollService.getMonthlyPayroll(month, year)));
    }

    @PutMapping("/{id}/mark-paid")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Mark payroll as paid")
    public ResponseEntity<ApiResponse<PayrollDTOs.Response>> markPaid(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Payroll marked as paid", payrollService.markAsPaid(id)));
    }
}
