package com.hrms.controller;

import com.hrms.dto.ChatbotDTOs;
import com.hrms.dto.ApiResponse;
import com.hrms.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

        private final ChatbotService chatbotService;

        // =========================================================
        // SEND MESSAGE
        // =========================================================

        @PostMapping("/message")
        public ResponseEntity<?> sendMessage(
                        @RequestBody ChatbotDTOs.MessageRequest request) {

                Authentication authentication = SecurityContextHolder
                                .getContext()
                                .getAuthentication();

                if (authentication == null ||
                                !authentication.isAuthenticated()) {

                        return ResponseEntity
                                        .status(401)
                                        .body("Authentication required.");
                }

                String email = authentication.getName();

                if (email == null || email.isBlank()) {

                        return ResponseEntity
                                        .status(401)
                                        .body(
                                                        ApiResponse.error(
                                                                        "Unable to identify the logged-in user."));
                }

                ChatbotDTOs.MessageResponse response = chatbotService.processMessage(
                                email,
                                request != null
                                                ? request.getMessage()
                                                : null);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                "HR Assistant response generated successfully.",
                                                response));
        }
}