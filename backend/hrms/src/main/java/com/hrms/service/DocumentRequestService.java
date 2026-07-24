package com.hrms.service;

import com.hrms.dto.DocumentRequestDTO;
import com.hrms.dto.DocumentRequestResponseDTO;
import com.hrms.entity.DocumentRequest;
import com.hrms.enums.DocumentRequestStatus;
import com.hrms.repository.DocumentRequestRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class DocumentRequestService {

    @Autowired
    private DocumentRequestRepository documentRequestRepository;

    @Autowired
    private EmailService emailService;

    // The inbox candidates should send their documents to.
    // Add hr.documents.email=your-hr-inbox@company.com to application.properties to
    // override.
    @Value("${hr.documents.email:hr@saitejainfotech.com}")
    private String hrDocumentsEmail;

    public DocumentRequestResponseDTO sendDocumentRequest(DocumentRequestDTO dto) {
        try {

            // Validate Candidate Name
            if (dto.getCandidateName() == null || dto.getCandidateName().trim().isEmpty()) {
                return new DocumentRequestResponseDTO(false, "Candidate Name is required");
            }

            // Validate Email
            if (dto.getEmail() == null || dto.getEmail().trim().isEmpty()) {
                return new DocumentRequestResponseDTO(false, "Email Address is required");
            }

            // Validate Job Title
            if (dto.getJobTitle() == null || dto.getJobTitle().trim().isEmpty()) {
                return new DocumentRequestResponseDTO(false, "Job Title is required");
            }

            // Validate Interview Date
            if (dto.getInterviewDate() == null) {
                return new DocumentRequestResponseDTO(false, "Interview Date is required");
            }

            // Validate Submission Deadline
            if (dto.getSubmissionDeadline() == null) {
                return new DocumentRequestResponseDTO(false, "Submission Deadline is required");
            }

            // Check Duplicate Email
            if (documentRequestRepository.existsByEmail(dto.getEmail())) {
                return new DocumentRequestResponseDTO(
                        false,
                        "A document request has already been sent to this email address.");
            }

            // Save Request in its own short transaction — kept isolated so a later
            // email failure can never roll this back or poison another transaction.
            DocumentRequest request = saveNewRequest(dto);

            try {
                // Send Email — candidates reply by emailing documents to HR, no
                // onboarding link needed
                emailService.sendDocumentRequestEmail(
                        request.getEmail(),
                        request.getCandidateName(),
                        request.getJobTitle(),
                        request.getInterviewDate(),
                        request.getSubmissionDeadline(),
                        hrDocumentsEmail);

                // Update Status
                request.setStatus(DocumentRequestStatus.EMAIL_SENT);
                documentRequestRepository.save(request);

                log.info("Document request email sent successfully to {}", request.getEmail());

                return new DocumentRequestResponseDTO(
                        true,
                        "Document request sent successfully to " + request.getEmail());

            } catch (Exception emailEx) {
                // Row stays PENDING in the DB — HR can retry without hitting
                // the duplicate-check, since status never reached EMAIL_SENT.
                log.error("Email sending failed for {}", request.getEmail(), emailEx);
                return new DocumentRequestResponseDTO(
                        false,
                        "Document was saved but sending the email failed: " + emailEx.getMessage());
            }

        } catch (Exception e) {

            log.error("Error while sending document request", e);

            return new DocumentRequestResponseDTO(
                    false,
                    "Failed to send document request: " + e.getMessage());
        }
    }

    @Transactional
    protected DocumentRequest saveNewRequest(DocumentRequestDTO dto) {
        DocumentRequest request = DocumentRequest.builder()
                .candidateName(dto.getCandidateName())
                .email(dto.getEmail())
                .jobTitle(dto.getJobTitle())
                .interviewDate(dto.getInterviewDate())
                .submissionDeadline(dto.getSubmissionDeadline())
                .adminId(dto.getAdminId())
                .adminName(dto.getAdminName())
                .status(DocumentRequestStatus.PENDING)
                .build();

        return documentRequestRepository.save(request);
    }
}