package com.hrms.controller;

import com.hrms.dto.ApiResponse;
import com.hrms.dto.OnboardingDTOs;
import com.hrms.entity.Employee;
import com.hrms.service.OnboardingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
@Tag(name = "Recruitment & Onboarding")
public class OnboardingController {

    private final OnboardingService onboardingService;

    @PostMapping("/init/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Initialize onboarding for a new employee")
    public ResponseEntity<ApiResponse<OnboardingDTOs.Response>> init(
            @PathVariable Long employeeId,
            @AuthenticationPrincipal Employee hr) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Onboarding initialized",
                        onboardingService.initOnboarding(employeeId, hr.getId())));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Update onboarding checklist")
    public ResponseEntity<ApiResponse<OnboardingDTOs.Response>> update(
            @PathVariable Long id,
            @RequestBody OnboardingDTOs.UpdateRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Onboarding updated",
                onboardingService.updateOnboarding(id, req)));
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Get onboarding status for an employee")
    public ResponseEntity<ApiResponse<OnboardingDTOs.Response>> getByEmployee(
            @PathVariable Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success("Onboarding status",
                onboardingService.getByEmployeeId(employeeId)));
    }

    @GetMapping("/my")
    @Operation(summary = "Get my own onboarding status")
    public ResponseEntity<ApiResponse<OnboardingDTOs.Response>> my(
            @AuthenticationPrincipal Employee emp) {
        return ResponseEntity.ok(ApiResponse.success("My onboarding",
                onboardingService.getByEmployeeId(emp.getId())));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Get all onboarding records")
    public ResponseEntity<ApiResponse<Page<OnboardingDTOs.Response>>> all(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("All onboarding",
                onboardingService.getAll(PageRequest.of(page, size))));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Get pending onboarding records")
    public ResponseEntity<ApiResponse<Page<OnboardingDTOs.Response>>> pending(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Pending onboarding",
                onboardingService.getPending(PageRequest.of(page, size))));
    }
}
