package com.hrms.controller;

import com.hrms.dto.DocumentRequestDTO;
import com.hrms.dto.DocumentRequestResponseDTO;
import com.hrms.service.DocumentRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/document-request")
@RequiredArgsConstructor
@CrossOrigin
public class DocumentRequestController {

    private final DocumentRequestService documentRequestService;

    @PostMapping("/send")
    public ResponseEntity<DocumentRequestResponseDTO> sendDocumentRequest(@RequestBody DocumentRequestDTO request) {
        DocumentRequestResponseDTO result = documentRequestService.sendDocumentRequest(request);

        if (!result.isSuccess()) {
            return ResponseEntity.status(409).body(result);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/list")
    public ResponseEntity<?> listRequests() {
        // return list of requests
        return ResponseEntity.ok("Document requests list");
    }
}