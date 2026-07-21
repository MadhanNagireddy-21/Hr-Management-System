package com.hrms.controller;

import com.hrms.dto.ApiResponse;
import com.hrms.dto.RecruitmentDTOs;
import com.hrms.entity.Employee;
import com.hrms.service.RecruitmentService;
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

@RestController
@RequestMapping("/api/recruitment")
@RequiredArgsConstructor
@Tag(name = "Recruitment & Onboarding")
public class RecruitmentController {

    private final RecruitmentService recruitmentService;

    //Job Postings

    @PostMapping("/jobs")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Create job posting")
    public ResponseEntity<ApiResponse<RecruitmentDTOs.JobResponse>> createJob(
            @AuthenticationPrincipal Employee emp,
            @Valid @RequestBody RecruitmentDTOs.CreateJobRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Job posted", recruitmentService.createJob(emp.getId(), req)));
    }

    @PutMapping("/jobs/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Update job posting")
    public ResponseEntity<ApiResponse<RecruitmentDTOs.JobResponse>> updateJob(
            @PathVariable Long id, @RequestBody RecruitmentDTOs.UpdateJobRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Job updated",
                recruitmentService.updateJob(id, req)));
    }

    @GetMapping("/jobs")
    @Operation(summary = "Get all job postings (Admin/HR see all; public sees OPEN)")
    public ResponseEntity<ApiResponse<Page<RecruitmentDTOs.JobResponse>>> allJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Job postings",
                recruitmentService.getOpenJobs(PageRequest.of(page, size,
                        Sort.by("createdAt").descending()))));
    }

    @GetMapping("/jobs/all")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Get all jobs including drafts and closed (Admin/HR)")
    public ResponseEntity<ApiResponse<Page<RecruitmentDTOs.JobResponse>>> allJobsAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("All job postings",
                recruitmentService.getAllJobs(PageRequest.of(page, size,
                        Sort.by("createdAt").descending()))));
    }

    //Applications

    @PostMapping("/jobs/{jobId}/apply")
    @Operation(summary = "Apply for a job (external candidate)")
    public ResponseEntity<ApiResponse<RecruitmentDTOs.ApplicationResponse>> apply(
            @PathVariable Long jobId,
            @Valid @RequestBody RecruitmentDTOs.ApplyRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Application submitted",
                        recruitmentService.applyForJob(jobId, req)));
    }

    @GetMapping("/jobs/{jobId}/applications")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Get all applications for a job")
    public ResponseEntity<ApiResponse<Page<RecruitmentDTOs.ApplicationResponse>>> applications(
            @PathVariable Long jobId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Applications",
                recruitmentService.getApplicationsForJob(jobId,
                        PageRequest.of(page, size, Sort.by("appliedAt").descending()))));
    }

    @PutMapping("/applications/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Update application status / schedule interview")
    public ResponseEntity<ApiResponse<RecruitmentDTOs.ApplicationResponse>> updateApp(
            @PathVariable Long id,
            @RequestBody RecruitmentDTOs.UpdateApplicationRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Application updated",
                recruitmentService.updateApplication(id, req)));
    }
}
