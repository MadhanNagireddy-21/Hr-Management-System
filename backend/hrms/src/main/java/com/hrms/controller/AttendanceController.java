package com.hrms.controller;

import com.hrms.dto.ApiResponse;
import com.hrms.dto.AttendanceDTOs;
import com.hrms.entity.Employee;
import com.hrms.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@Tag(name = "Attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping("/check-in")
    @Operation(summary = "Check in")
    public ResponseEntity<ApiResponse<AttendanceDTOs.Response>> checkIn(
            @AuthenticationPrincipal Employee emp,
            @RequestBody(required = false) AttendanceDTOs.CheckInRequest req) {
        if (req == null) req = new AttendanceDTOs.CheckInRequest();
        return ResponseEntity.ok(ApiResponse.success("Checked in", attendanceService.checkIn(emp.getId(), req)));
    }

    @PostMapping("/check-out")
    @Operation(summary = "Check out (optionally add remarks)")
    public ResponseEntity<ApiResponse<AttendanceDTOs.Response>> checkOut(
            @AuthenticationPrincipal Employee emp,
            @RequestBody(required = false) AttendanceDTOs.CheckOutRequest req) {
        if (req == null) req = new AttendanceDTOs.CheckOutRequest();
        return ResponseEntity.ok(ApiResponse.success("Checked out", attendanceService.checkOut(emp.getId(), req)));
    }

    @GetMapping("/my")
    @Operation(summary = "Get my attendance")
    public ResponseEntity<ApiResponse<Page<AttendanceDTOs.Response>>> my(
            @AuthenticationPrincipal Employee emp,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return ResponseEntity.ok(ApiResponse.success("Attendance records",
                attendanceService.getMyAttendance(emp.getId(),
                        PageRequest.of(page, size, Sort.by("date").descending()))));
    }

    @GetMapping("/date/{date}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Get attendance by date (Admin/HR)")
    public ResponseEntity<ApiResponse<Page<AttendanceDTOs.Response>>> byDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.success("Attendance for " + date,
                attendanceService.getAttendanceByDate(date, PageRequest.of(page, size))));
    }
}