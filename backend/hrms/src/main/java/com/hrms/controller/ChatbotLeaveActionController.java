package com.hrms.controller;

import com.hrms.dto.ApiResponse;
import com.hrms.dto.LeaveDTOs;
import com.hrms.entity.Employee;
import com.hrms.service.LeaveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/chatbot/actions")
@RequiredArgsConstructor
public class ChatbotLeaveActionController {

    private final LeaveService leaveService;

    // ============================================================
    // AI CHATBOT - APPLY FOR LEAVE
    // ============================================================

    @PostMapping("/leave/apply")
    public ResponseEntity<ApiResponse<LeaveDTOs.Response>> applyLeave(
            @AuthenticationPrincipal Employee employee,
            @Valid @RequestBody LeaveActionRequest request) {

        if (employee == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.success(
                            "Authentication required",
                            null));
        }

        LeaveDTOs.CreateRequest leaveRequest = new LeaveDTOs.CreateRequest();

        leaveRequest.setLeaveType(
                request.getLeaveType());

        leaveRequest.setStartDate(
                request.getStartDate());

        leaveRequest.setEndDate(
                request.getEndDate());

        leaveRequest.setReason(
                request.getReason());

        // Chatbot applications do not upload attachments.
        leaveRequest.setAttachmentUrl(null);
        leaveRequest.setAttachmentFileName(null);

        LeaveDTOs.Response response = leaveService.applyLeave(
                employee.getId(),
                leaveRequest);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        ApiResponse.success(
                                "Leave applied successfully",
                                response));
    }

    // ============================================================
    // REQUEST DTO
    // ============================================================

    public static class LeaveActionRequest {

        private String leaveType;

        private LocalDate startDate;

        private LocalDate endDate;

        private String reason;

        public LeaveActionRequest() {
        }

        public String getLeaveType() {
            return leaveType;
        }

        public void setLeaveType(String leaveType) {
            this.leaveType = leaveType;
        }

        public LocalDate getStartDate() {
            return startDate;
        }

        public void setStartDate(LocalDate startDate) {
            this.startDate = startDate;
        }

        public LocalDate getEndDate() {
            return endDate;
        }

        public void setEndDate(LocalDate endDate) {
            this.endDate = endDate;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }
}