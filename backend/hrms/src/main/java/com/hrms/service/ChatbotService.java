package com.hrms.service;
import com.hrms.dto.AttendanceDTOs;
import com.hrms.dto.ChatbotDTOs;
import com.hrms.dto.LeaveDTOs;
import com.hrms.dto.PayrollDTOs;
import com.hrms.entity.Attendance;
import com.hrms.entity.Employee;
import com.hrms.entity.Payroll;
import com.hrms.entity.Training;
import com.hrms.entity.Training.TrainingStatus;
import com.hrms.entity.TrainingEnrollment;
import com.hrms.entity.JobPosting;
import com.hrms.entity.JobApplication;
import com.hrms.entity.JobPosting.PostingStatus;
import com.hrms.enums.LeaveStatus;
import com.hrms.enums.Role;
import com.hrms.repository.AttendanceRepository;
import com.hrms.repository.EmployeeRepository;
import com.hrms.repository.JobPostingRepository;
import com.hrms.repository.JobApplicationRepository;
import com.hrms.repository.TrainingEnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Month;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.math.BigDecimal;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatbotService {

        private final EmployeeRepository employeeRepository;
        private final LeaveBalanceService leaveBalanceService;
        private final LeaveService leaveService;
        private final AttendanceRepository attendanceRepository;
        private final AttendanceService attendanceService;
        private final PayrollService payrollService;
        private final TrainingEnrollmentRepository trainingEnrollmentRepository;
        private final JobPostingRepository jobPostingRepository;
        private final JobApplicationRepository jobApplicationRepository;
        private static final ZoneId IST_ZONE = ZoneId.of("Asia/Kolkata");

        // =========================================================
        // MAIN CHAT METHOD
        // =========================================================

        @Transactional(readOnly = true)
        public ChatbotDTOs.MessageResponse processMessage(
                        String authenticatedEmail,
                        String userMessage) {

                if (authenticatedEmail == null ||
                                authenticatedEmail.isBlank()) {

                        throw new RuntimeException(
                                        "Authenticated user could not be identified.");
                }

                if (userMessage == null ||
                                userMessage.trim().isEmpty()) {

                        return createResponse(
                                        "Please enter a question so I can help you.",
                                        "UNKNOWN",
                                        "TEXT",
                                        null,
                                        null,
                                        null);
                }

                Employee employee = employeeRepository
                                .findByEmail(
                                                authenticatedEmail
                                                                .trim()
                                                                .toLowerCase(Locale.ROOT))
                                .orElseThrow(() -> new RuntimeException(
                                                "Employee account could not be found."));

                String message = userMessage
                                .trim()
                                .toLowerCase(Locale.ROOT);

                // =====================================================
                // GREETING
                // =====================================================

                if (isGreeting(message)) {

                        String firstName = employee.getFirstName();

                        if (firstName == null ||
                                        firstName.isBlank()) {

                                firstName = "there";
                        }

                        return createResponse(
                                        "Hello " + firstName +
                                                        "! 👋 I'm your HR Assistant.\n\n" +
                                                        "I can help you with:\n" +
                                                        "🏖️ Leave balance\n" +
                                                        "📋 Leave history & status\n" +
                                                        "🕐 Today's attendance\n" +
                                                        "📊 Attendance analytics\n" +
                                                        "🎓 Training & learning\n" +
                                                        "💼 Recruitment & job openings\n" +
                                                        "👥 My referrals\n" +
                                                        "💰 Payroll & payslips\n\n" +
                                                        "You can ask me things like:\n" +
                                                        "• What is my leave balance?\n" +
                                                        "• What is my attendance today?\n" +
                                                        "• What was my attendance yesterday?\n" +
                                                        "• Show my attendance this week\n" +
                                                        "• What is my attendance percentage?",
                                        "GREETING",
                                        "TEXT",
                                        null,
                                        null,
                                        null);
                }

                // =====================================================
                // EMPLOYEE PROFILE
                // =====================================================

                if (isEmployeeProfileQuestion(message)) {
                        return getEmployeeProfileResponse(employee, message);
                }

                // =====================================================
                // ORGANIZATION EMPLOYEE COUNT
                // =====================================================

                if (isEmployeeCountQuestion(message)) {
                        return getEmployeeCountResponse(employee);
                }

                // =====================================================
                // LEAVE MANAGEMENT / HISTORY
                // =====================================================

                if (isLeaveManagementQuestion(message)) {

                        return getLeaveManagementResponse(
                                        employee,
                                        message);
                }

                // =====================================================
                // LEAVE BALANCE
                // =====================================================

                if (isLeaveBalanceQuestion(message)) {

                        return getLeaveBalanceResponse(
                                        employee,
                                        message);
                }

                // =====================================================
                // ATTENDANCE ANALYTICS
                // =====================================================

                if (isAttendanceAnalyticsQuestion(message)) {

                        return getAttendanceAnalyticsResponse(
                                        employee,
                                        message);
                }

                // =====================================================
                // TODAY'S ATTENDANCE
                // =====================================================

                if (isAttendanceQuestion(message)) {

                        return getAttendanceResponse(
                                        employee,
                                        message);
                }

                // =====================================================
                // TRAINING / LEARNING
                // =====================================================

                if (isTrainingQuestion(message)) {
                        return getTrainingResponse(employee, message);
                }

                // =====================================================
                // RECRUITMENT / JOB OPENINGS
                // =====================================================

                if (isRecruitmentQuestion(message)) {
                        return getRecruitmentResponse(employee, message);
                }

                // =====================================================
                // PAYROLL / PAYSLIP
                // =====================================================

                if (isPayrollQuestion(message)) {

                        return getPayrollResponse(employee, message);
                }

                // =====================================================
                // HELP
                // =====================================================

                if (containsAny(
                                message,
                                "help",
                                "what can you do",
                                "what do you do",
                                "features")) {

                        return createResponse(
                                        "I can currently help you with:\n\n" +
                                                        "🏖️ Leave balance\n" +
                                                        "🕐 Today's attendance\n" +
                                                        "📊 Attendance analytics\n" +
                                                        "💰 Payroll & payslips\n\n" +

                                                        "Try asking:\n" +
                                                        "• What is my leave balance?\n" +
                                                        "• How many sick leaves do I have?\n" +
                                                        "• What is my attendance today?\n" +
                                                        "• Did I check in today?\n" +
                                                        "• What time did I check in?\n" +
                                                        "• What was my attendance yesterday?\n" +
                                                        "• Show my attendance this week\n" +
                                                        "• What is my attendance percentage?\n" +
                                                        "• How many hours did I work this month?\n" +
                                                        "• Show my training\n" +
                                                        "• Show open job openings\n" +
                                                        "• Show Java jobs\n" +
                                                        "• Show my referrals\n" +
                                                        "• Show my latest payslip\n" +
                                                        "• What is my net salary?\n" +
                                                        "• How much was deducted?\n" +
                                                        "• Show my payroll history",
                                        "HELP",
                                        "TEXT",
                                        null,
                                        null,
                                        null);
                }

                // =====================================================
                // FALLBACK
                // =====================================================

                return createResponse(
                                "I understand your question, but that HR capability " +
                                                "is not connected yet.\n\n" +
                                                "Currently I can help with:\n" +
                                                "👥 Employee information & workforce count\n" +
                                                "🏖️ Leave balance\n" +
                                                "🕐 Today's attendance\n" +
                                                "📊 Attendance analytics\n" +
                                                "🎓 Training & learning\n" +
                                                "💼 Recruitment & job openings\n" +
                                                "👥 My referrals\n" +
                                                "💰 Payroll & payslips",
                                "UNKNOWN",
                                "TEXT",
                                null,
                                null,
                                null);
        }

        // =========================================================
        // EMPLOYEE COUNT
        // =========================================================

        private ChatbotDTOs.MessageResponse getEmployeeCountResponse(
                        Employee employee) {

                if (!isHrOrAdmin(employee)) {
                        return createResponse(
                                        "Employee count information is available only to HR and Admin users.",
                                        "EMPLOYEE_COUNT_ACCESS_DENIED",
                                        "EMPLOYEE_COUNT",
                                        null,
                                        null,
                                        null);
                }

                long totalEmployees = employeeRepository.count();

                return createResponse(
                                "There are currently **" + totalEmployees
                                                + "** employees in the HRMS. 👥",
                                "EMPLOYEE_COUNT",
                                "EMPLOYEE_COUNT",
                                null,
                                null,
                                null);
        }

        private boolean isEmployeeCountQuestion(String message) {
                if (message == null || message.isBlank()) {
                        return false;
                }

                return containsAny(
                                message,
                                "how many employees",
                                "how many employee",
                                "employee count",
                                "number of employees",
                                "number of employee",
                                "total employees",
                                "total employee",
                                "employee total",
                                "how many staff",
                                "staff count",
                                "total staff",
                                "number of staff",
                                "workforce count",
                                "how large is the workforce");
        }

        // =========================================================
        // EMPLOYEE PROFILE
        // =========================================================

        private ChatbotDTOs.MessageResponse getEmployeeProfileResponse(
                        Employee employee,
                        String message) {

                ChatbotDTOs.EmployeeProfileItem profile = new ChatbotDTOs.EmployeeProfileItem(
                                employee.getEmployeeId(),
                                buildFullName(
                                                employee.getFirstName(),
                                                employee.getLastName()),
                                employee.getEmail(),
                                employee.getPhone(),
                                employee.getDepartment(),
                                employee.getDesignation(),
                                employee.getDateOfJoining(),
                                employee.getRole() != null
                                                ? employee.getRole().name()
                                                : null,
                                employee.isActive());

                String reply = buildEmployeeProfileReply(employee, message);

                return new ChatbotDTOs.MessageResponse(
                                reply,
                                resolveEmployeeProfileIntent(message),
                                "EMPLOYEE_PROFILE",
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                profile,
                                LocalDateTime.now(IST_ZONE));
        }

        private String buildEmployeeProfileReply(
                        Employee employee,
                        String message) {

                String name = buildFullName(
                                employee.getFirstName(),
                                employee.getLastName());

                if (containsAny(message,
                                "employee id",
                                "employee code",
                                "staff id",
                                "my id")) {
                        return "Your employee ID is **"
                                        + safeValue(employee.getEmployeeId()) + "**.";
                }

                if (containsAny(message, "email", "email address")) {
                        return "Your registered email address is **"
                                        + safeValue(employee.getEmail()) + "**.";
                }

                if (containsAny(message, "phone", "mobile", "contact number", "phone number")) {
                        return "Your registered phone number is **"
                                        + safeValue(employee.getPhone()) + "**.";
                }

                if (containsAny(message, "department")) {
                        return "Your department is **"
                                        + safeValue(employee.getDepartment()) + "**.";
                }

                if (containsAny(message, "designation", "job title", "position")) {
                        return "Your designation is **"
                                        + safeValue(employee.getDesignation()) + "**.";
                }

                if (containsAny(message, "joining date", "date of joining", "when did i join", "joined")) {
                        return "Your date of joining is **"
                                        + (employee.getDateOfJoining() != null
                                                        ? employee.getDateOfJoining()
                                                        : "Not available")
                                        + "**.";
                }

                if (containsAny(message, "role", "my role")) {
                        return "Your HRMS role is **"
                                        + (employee.getRole() != null
                                                        ? employee.getRole().name()
                                                        : "Not available")
                                        + "**.";
                }

                if (containsAny(message, "active", "account status", "employment status", "status")) {
                        return employee.isActive()
                                        ? "Your employee account is currently **Active**. ✅"
                                        : "Your employee account is currently **Inactive**.";
                }

                return "Here are your employee profile details, **"
                                + safeValue(name) + ":** 👤\n\n"
                                + "Employee ID: **" + safeValue(employee.getEmployeeId()) + "**\n"
                                + "Email: **" + safeValue(employee.getEmail()) + "**\n"
                                + "Phone: **" + safeValue(employee.getPhone()) + "**\n"
                                + "Department: **" + safeValue(employee.getDepartment()) + "**\n"
                                + "Designation: **" + safeValue(employee.getDesignation()) + "**\n"
                                + "Date of Joining: **"
                                + (employee.getDateOfJoining() != null
                                                ? employee.getDateOfJoining()
                                                : "Not available")
                                + "**\n"
                                + "Role: **"
                                + (employee.getRole() != null
                                                ? employee.getRole().name()
                                                : "Not available")
                                + "**\n"
                                + "Account Status: **"
                                + (employee.isActive() ? "Active" : "Inactive") + "**";
        }

        private String resolveEmployeeProfileIntent(String message) {
                if (containsAny(message, "employee id", "employee code", "staff id", "my id")) {
                        return "EMPLOYEE_PROFILE_ID";
                }
                if (containsAny(message, "email", "email address")) {
                        return "EMPLOYEE_PROFILE_EMAIL";
                }
                if (containsAny(message, "phone", "mobile", "contact number", "phone number")) {
                        return "EMPLOYEE_PROFILE_PHONE";
                }
                if (containsAny(message, "department")) {
                        return "EMPLOYEE_PROFILE_DEPARTMENT";
                }
                if (containsAny(message, "designation", "job title", "position")) {
                        return "EMPLOYEE_PROFILE_DESIGNATION";
                }
                if (containsAny(message, "joining date", "date of joining", "when did i join", "joined")) {
                        return "EMPLOYEE_PROFILE_JOINING_DATE";
                }
                if (containsAny(message, "role", "my role")) {
                        return "EMPLOYEE_PROFILE_ROLE";
                }
                if (containsAny(message, "active", "account status", "employment status", "status")) {
                        return "EMPLOYEE_PROFILE_STATUS";
                }
                return "EMPLOYEE_PROFILE";
        }

        private boolean isEmployeeProfileQuestion(String message) {
                if (message == null || message.isBlank()) {
                        return false;
                }

                return containsAny(message,
                                "my profile",
                                "my employee profile",
                                "employee profile",
                                "my employee details",
                                "employee details",
                                "my details",
                                "my information",
                                "employee information",
                                "my employee id",
                                "my employee code",
                                "my staff id",
                                "my email",
                                "my phone",
                                "my mobile",
                                "my department",
                                "my designation",
                                "my job title",
                                "my position",
                                "my joining date",
                                "date of joining",
                                "when did i join",
                                "my role",
                                "my account status",
                                "am i active");
        }

        private String safeValue(String value) {
                return value == null || value.isBlank()
                                ? "Not available"
                                : value;
        }

        private String buildFullName(String firstName, String lastName) {
                String first = firstName != null ? firstName.trim() : "";
                String last = lastName != null ? lastName.trim() : "";
                String full = (first + " " + last).trim();
                return full.isEmpty() ? "there" : full;
        }

        // =========================================================
        // TRAINING / LEARNING
        // =========================================================

        private ChatbotDTOs.MessageResponse getTrainingResponse(
                        Employee employee,
                        String message) {

                List<TrainingEnrollment> enrollments = trainingEnrollmentRepository
                                .findByEmployee(
                                                employee,
                                                PageRequest.of(
                                                                0,
                                                                100,
                                                                Sort.by(Sort.Direction.DESC, "enrolledAt")))
                                .getContent();

                List<ChatbotDTOs.TrainingItem> items = enrollments.stream()
                                .map(this::toTrainingItem)
                                .filter(item -> matchesTrainingFilter(item, message))
                                .limit(20)
                                .collect(Collectors.toList());

                String intent = resolveTrainingIntent(message);
                String reply = buildTrainingReply(items, message, intent);

                ChatbotDTOs.MessageResponse response = createResponse(
                                reply,
                                intent,
                                "TRAINING",
                                null,
                                null,
                                null);

                response.setTrainings(items);
                return response;
        }

        private boolean isTrainingQuestion(String message) {
                if (message == null || message.isBlank()) {
                        return false;
                }

                return containsAny(
                                message,
                                "training",
                                "trainings",
                                "my training",
                                "my trainings",
                                "training program",
                                "training programs",
                                "course",
                                "courses",
                                "learning",
                                "learning program",
                                "upcoming training",
                                "ongoing training",
                                "completed training",
                                "completed trainings",
                                "training history",
                                "training status",
                                "enrolled training",
                                "enrolled trainings");
        }

        private boolean matchesTrainingFilter(
                        ChatbotDTOs.TrainingItem item,
                        String message) {

                if (containsAny(message,
                                "completed training",
                                "completed trainings",
                                "completed course",
                                "completed courses",
                                "training completed",
                                "course completed")) {
                        return item.isCompleted()
                                        || "COMPLETED".equalsIgnoreCase(item.getEnrollmentStatus());
                }

                if (containsAny(message,
                                "upcoming training",
                                "upcoming trainings",
                                "upcoming course",
                                "upcoming courses",
                                "next training",
                                "next course")) {
                        return "UPCOMING".equalsIgnoreCase(item.getTrainingStatus());
                }

                if (containsAny(message,
                                "ongoing training",
                                "ongoing trainings",
                                "ongoing course",
                                "current training",
                                "current course")) {
                        return "ONGOING".equalsIgnoreCase(item.getTrainingStatus());
                }

                if (containsAny(message,
                                "enrolled training",
                                "enrolled trainings",
                                "enrolled course",
                                "enrolled courses")) {
                        return "ENROLLED".equalsIgnoreCase(item.getEnrollmentStatus());
                }

                return true;
        }

        private String resolveTrainingIntent(String message) {
                if (containsAny(message,
                                "completed training",
                                "completed trainings",
                                "completed course",
                                "completed courses")) {
                        return "TRAINING_COMPLETED";
                }

                if (containsAny(message,
                                "upcoming training",
                                "upcoming trainings",
                                "upcoming course",
                                "upcoming courses",
                                "next training",
                                "next course")) {
                        return "TRAINING_UPCOMING";
                }

                if (containsAny(message,
                                "ongoing training",
                                "ongoing trainings",
                                "current training",
                                "current course")) {
                        return "TRAINING_ONGOING";
                }

                if (containsAny(message,
                                "training history",
                                "past training",
                                "past trainings",
                                "training records")) {
                        return "TRAINING_HISTORY";
                }

                if (containsAny(message,
                                "training status",
                                "status of my training",
                                "status of my trainings")) {
                        return "TRAINING_STATUS";
                }

                return "MY_TRAININGS";
        }

        private String buildTrainingReply(
                        List<ChatbotDTOs.TrainingItem> items,
                        String message,
                        String intent) {

                if (items.isEmpty()) {
                        return switch (intent) {
                                case "TRAINING_COMPLETED" ->
                                        "You don't have any completed trainings in your records yet. 🎓";
                                case "TRAINING_UPCOMING" ->
                                        "You don't have any upcoming trainings assigned to you right now. 📅";
                                case "TRAINING_ONGOING" ->
                                        "You don't have any ongoing trainings right now. 🟡";
                                default ->
                                        "I couldn't find any training records assigned to your account yet. 🎓";
                        };
                }

                if (items.size() == 1) {
                        ChatbotDTOs.TrainingItem item = items.get(0);
                        return buildSingleTrainingReply(item, message);
                }

                StringBuilder reply = new StringBuilder();

                switch (intent) {
                        case "TRAINING_COMPLETED" ->
                                reply.append("Here are your completed trainings: 🎓\\n\\n");
                        case "TRAINING_UPCOMING" ->
                                reply.append("Here are your upcoming trainings: 📅\\n\\n");
                        case "TRAINING_ONGOING" ->
                                reply.append("Here are your ongoing trainings: 🟡\\n\\n");
                        case "TRAINING_HISTORY" ->
                                reply.append("Here is your training history: 📚\\n\\n");
                        default ->
                                reply.append("Here are your training records: 🎓\\n\\n");
                }

                for (int i = 0; i < items.size(); i++) {
                        ChatbotDTOs.TrainingItem item = items.get(i);

                        reply.append(i + 1)
                                        .append(". **")
                                        .append(safeValue(item.getTitle()))
                                        .append("**\\n")
                                        .append("   Status: **")
                                        .append(formatTrainingStatus(item))
                                        .append("**\\n")
                                        .append("   Dates: **")
                                        .append(formatTrainingDates(item))
                                        .append("**\\n")
                                        .append("   Trainer: **")
                                        .append(safeValue(item.getTrainer()))
                                        .append("**\\n\\n");
                }

                if (items.size() == 20) {
                        reply.append("Showing the latest 20 training records.");
                }

                return reply.toString().trim();
        }

        private String buildSingleTrainingReply(
                        ChatbotDTOs.TrainingItem item,
                        String message) {

                if (containsAny(message,
                                "trainer",
                                "who is the trainer",
                                "training trainer")) {
                        return "The trainer for **" + safeValue(item.getTitle())
                                        + "** is **" + safeValue(item.getTrainer()) + "**.";
                }

                if (containsAny(message,
                                "when",
                                "date",
                                "start date",
                                "start")) {
                        return "**" + safeValue(item.getTitle()) + "** is scheduled from **"
                                        + formatTrainingDates(item) + "**.";
                }

                if (containsAny(message,
                                "where",
                                "venue",
                                "location")) {
                        return "**" + safeValue(item.getTitle()) + "** is scheduled at **"
                                        + safeValue(item.getVenue()) + "**.";
                }

                if (containsAny(message,
                                "online",
                                "meeting link",
                                "link",
                                "join")) {
                        if (item.getMeetingLink() == null || item.getMeetingLink().isBlank()) {
                                return "A meeting link is not available for **"
                                                + safeValue(item.getTitle()) + "** yet.";
                        }
                        return "The meeting link for **" + safeValue(item.getTitle())
                                        + "** is available in your training details. 🔗";
                }

                if (containsAny(message,
                                "score",
                                "marks",
                                "result")) {
                        return "Your score for **" + safeValue(item.getTitle()) + "** is **"
                                        + (item.getScore() != null ? item.getScore() + "/100" : "Not available")
                                        + "**.";
                }

                return "Here are the details for **" + safeValue(item.getTitle()) + ":** 🎓\\n\\n"
                                + "Category: **" + safeValue(item.getCategory()) + "**\\n"
                                + "Trainer: **" + safeValue(item.getTrainer()) + "**\\n"
                                + "Mode: **" + safeValue(item.getMode()) + "**\\n"
                                + "Dates: **" + formatTrainingDates(item) + "**\\n"
                                + "Duration: **" + (item.getDurationHours() != null
                                                ? item.getDurationHours() + " hour(s)"
                                                : "Not available")
                                + "**\\n"
                                + "Status: **" + formatTrainingStatus(item) + "**\\n"
                                + "Enrollment: **" + safeValue(item.getEnrollmentStatus()) + "**";
        }

        private ChatbotDTOs.TrainingItem toTrainingItem(
                        TrainingEnrollment enrollment) {

                Training training = enrollment.getTraining();

                return new ChatbotDTOs.TrainingItem(
                                enrollment.getId(),
                                training.getId(),
                                training.getTitle(),
                                training.getDescription(),
                                training.getCategory(),
                                training.getTrainer(),
                                training.getMode() != null ? String.valueOf(training.getMode()) : null,
                                training.getStartDate(),
                                training.getEndDate(),
                                training.getDurationHours(),
                                training.getMaxParticipants(),
                                training.getEnrollments() != null
                                                ? training.getEnrollments().size()
                                                : null,
                                training.getVenue(),
                                training.getMeetingLink(),
                                resolveTrainingStatus(training),
                                enrollment.getStatus() != null
                                                ? enrollment.getStatus().name()
                                                : null,
                                Boolean.TRUE.equals(enrollment.getCompleted()),
                                enrollment.getScore(),
                                enrollment.getFeedback(),
                                enrollment.getEnrolledAt(),
                                enrollment.getCompletedAt());
        }

        private String resolveTrainingStatus(Training training) {
                if (training.getStatus() == TrainingStatus.CANCELLED) {
                        return "CANCELLED";
                }

                if (training.getStatus() == TrainingStatus.COMPLETED) {
                        return "COMPLETED";
                }

                LocalDate today = LocalDate.now(IST_ZONE);

                if (training.getStartDate() == null || training.getEndDate() == null) {
                        return training.getStatus() != null
                                        ? training.getStatus().name()
                                        : "UPCOMING";
                }

                if (today.isBefore(training.getStartDate())) {
                        return "UPCOMING";
                }

                if (!today.isAfter(training.getEndDate())) {
                        return "ONGOING";
                }

                return "COMPLETED";
        }

        private String formatTrainingStatus(ChatbotDTOs.TrainingItem item) {
                String trainingStatus = safeValue(item.getTrainingStatus());
                String enrollmentStatus = safeValue(item.getEnrollmentStatus());

                if (item.isCompleted() || "COMPLETED".equalsIgnoreCase(enrollmentStatus)) {
                        return "Completed";
                }

                if ("CANCELLED".equalsIgnoreCase(trainingStatus)) {
                        return "Cancelled";
                }

                if ("ONGOING".equalsIgnoreCase(trainingStatus)) {
                        return "Ongoing";
                }

                if ("UPCOMING".equalsIgnoreCase(trainingStatus)) {
                        return "Upcoming";
                }

                return trainingStatus;
        }

        private String formatTrainingDates(ChatbotDTOs.TrainingItem item) {
                String start = item.getStartDate() != null
                                ? item.getStartDate().toString()
                                : "Not available";
                String end = item.getEndDate() != null
                                ? item.getEndDate().toString()
                                : "Not available";

                if (start.equals(end)) {
                        return start;
                }

                return start + " to " + end;
        }

        // =========================================================
        // RECRUITMENT / JOB OPENINGS
        // =========================================================

        private ChatbotDTOs.MessageResponse getRecruitmentResponse(
                        Employee employee,
                        String message) {

                if (isMyReferralsQuestion(message)) {
                        return getMyReferralsResponse(employee);
                }

                // HR/Admin recruitment intelligence is handled separately from
                // employee-facing open job searches. This keeps aggregate hiring
                // metrics restricted to authorized HR and Admin users.
                if (isRecruitmentManagementQuestion(message)) {
                        if (!isHrOrAdmin(employee)) {
                                return createResponse(
                                                "Recruitment management insights are available only to HR and Admin users. "
                                                                +
                                                                "You can still ask me to show available job openings.",
                                                "RECRUITMENT_ACCESS_DENIED",
                                                "RECRUITMENT",
                                                null,
                                                null,
                                                null);
                        }

                        return getRecruitmentSummaryResponse(message);
                }

                List<JobPosting> jobs = jobPostingRepository
                                .findByStatus(
                                                PostingStatus.OPEN,
                                                PageRequest.of(
                                                                0,
                                                                100,
                                                                Sort.by(Sort.Direction.DESC, "createdAt")))
                                .getContent();

                String requestedTitle = extractJobTitle(message);
                String requestedDepartment = extractJobDepartment(message);
                String requestedLocation = extractJobLocation(message);

                List<JobPosting> filteredJobs = jobs.stream()
                                .filter(job -> matchesJobFilter(
                                                job,
                                                message,
                                                requestedTitle,
                                                requestedDepartment,
                                                requestedLocation))
                                .limit(20)
                                .collect(Collectors.toList());

                String intent = resolveRecruitmentIntent(message);

                // A specific numeric job id can be requested only when the user
                // explicitly mentions it. We still verify that the job is OPEN.
                Long requestedJobId = extractJobId(message);
                if (requestedJobId != null) {
                        Optional<JobPosting> requestedJob = jobPostingRepository
                                        .findById(requestedJobId)
                                        .filter(job -> job.getStatus() == PostingStatus.OPEN);

                        if (requestedJob.isPresent()) {
                                filteredJobs = List.of(requestedJob.get());
                                intent = "JOB_DETAILS";
                        }
                }

                List<ChatbotDTOs.JobItem> items = filteredJobs.stream()
                                .map(this::toJobItem)
                                .collect(Collectors.toList());

                String reply = buildRecruitmentReply(items, message, intent);

                ChatbotDTOs.MessageResponse response = createResponse(
                                reply,
                                intent,
                                "RECRUITMENT",
                                null,
                                null,
                                null);

                response.setJobs(items);
                return response;
        }

        private ChatbotDTOs.MessageResponse getMyReferralsResponse(
                        Employee employee) {

                String role = employee.getRole() != null
                                ? employee.getRole().name()
                                : "";

                if (!"EMPLOYEE".equalsIgnoreCase(role)) {
                        return createResponse(
                                        "My referrals are available through the employee referral workflow. " +
                                                        "Your current role does not use the employee referral endpoint.",
                                        "MY_REFERRALS",
                                        "RECRUITMENT",
                                        null,
                                        null,
                                        null);
                }

                List<JobApplication> referrals = jobApplicationRepository
                                .findByReferredBy(
                                                employee,
                                                PageRequest.of(
                                                                0,
                                                                100,
                                                                Sort.by(Sort.Direction.DESC, "appliedAt")))
                                .getContent();

                List<ChatbotDTOs.RecruitmentApplicationItem> items = referrals.stream()
                                .limit(20)
                                .map(this::toRecruitmentApplicationItem)
                                .collect(Collectors.toList());

                StringBuilder reply = new StringBuilder();

                if (items.isEmpty()) {
                        reply.append("I couldn't find any candidate referrals linked to your account yet. 👥");
                } else {
                        reply.append("Here are your latest candidate referrals: 👥\\n\\n");
                        for (int i = 0; i < items.size(); i++) {
                                ChatbotDTOs.RecruitmentApplicationItem item = items.get(i);
                                reply.append(i + 1)
                                                .append(". **")
                                                .append(safeValue(item.getCandidateName()))
                                                .append("**\\n")
                                                .append("   Position: **")
                                                .append(safeValue(item.getJobTitle()))
                                                .append("**\\n")
                                                .append("   Status: **")
                                                .append(formatApplicationStatus(item.getStatus()))
                                                .append("**\\n")
                                                .append("   Experience: **")
                                                .append(formatExperience(item.getExperienceYears(),
                                                                item.getExperienceMonths()))
                                                .append("**\\n")
                                                .append("   Applied: **")
                                                .append(formatDateTime(item.getAppliedAt()))
                                                .append("**\\n\\n");
                        }
                }

                ChatbotDTOs.MessageResponse response = createResponse(
                                reply.toString().trim(),
                                "MY_REFERRALS",
                                "RECRUITMENT",
                                null,
                                null,
                                null);
                response.setRecruitmentApplications(items);
                return response;
        }

        private boolean isHrOrAdmin(Employee employee) {
                if (employee == null || employee.getRole() == null) {
                        return false;
                }

                String role = employee.getRole().name();
                return "ADMIN".equalsIgnoreCase(role) ||
                                "HR".equalsIgnoreCase(role);
        }

        private boolean isRecruitmentManagementQuestion(String message) {
                if (message == null || message.isBlank()) {
                        return false;
                }

                return containsAny(
                                message,
                                "recruitment status",
                                "recruitment summary",
                                "recruitment report",
                                "recruitment overview",
                                "recruitment metrics",
                                "hiring status",
                                "hiring summary",
                                "hiring report",
                                "application count",
                                "application counts",
                                "total applications",
                                "candidate count",
                                "candidate counts",
                                "candidate pipeline",
                                "shortlisted candidates",
                                "how many shortlisted",
                                "interview scheduled",
                                "interviews scheduled",
                                "upcoming interviews",
                                "interview count",
                                "offer count",
                                "offers sent",
                                "offers accepted",
                                "offers rejected",
                                "rejected candidates",
                                "withdrawn candidates",
                                "jobs closing soon",
                                "job closing soon",
                                "positions closing soon",
                                "open positions count",
                                "how many open positions",
                                "how many open jobs");
        }

        private ChatbotDTOs.MessageResponse getRecruitmentSummaryResponse(String message) {
                LocalDate today = LocalDate.now(IST_ZONE);

                int totalJobs = (int) jobPostingRepository.count();
                int openJobs = (int) jobPostingRepository.countByStatus(PostingStatus.OPEN);
                int draftJobs = (int) jobPostingRepository.countByStatus(PostingStatus.DRAFT);
                int onHoldJobs = (int) jobPostingRepository.countByStatus(PostingStatus.ON_HOLD);
                int closedJobs = (int) jobPostingRepository.countByStatus(PostingStatus.CLOSED);

                int applied = countApplications(JobApplication.ApplicationStatus.APPLIED);
                int shortlisted = countApplications(JobApplication.ApplicationStatus.SHORTLISTED);
                int interviewScheduled = countApplications(JobApplication.ApplicationStatus.INTERVIEW_SCHEDULED);
                int interviewed = countApplications(JobApplication.ApplicationStatus.INTERVIEWED);
                int offerSent = countApplications(JobApplication.ApplicationStatus.OFFER_SENT);
                int offerAccepted = countApplications(JobApplication.ApplicationStatus.OFFER_ACCEPTED);
                int offerRejected = countApplications(JobApplication.ApplicationStatus.OFFER_REJECTED);
                int rejected = countApplications(JobApplication.ApplicationStatus.REJECTED);
                int withdrawn = countApplications(JobApplication.ApplicationStatus.WITHDRAWN);

                int totalApplications = (int) jobApplicationRepository.count();

                LocalDate interviewEnd = today.plusDays(7);
                int upcomingInterviews = jobApplicationRepository.findAll().stream()
                                .filter(application -> application.getInterviewDate() != null)
                                .filter(application -> !application.getInterviewDate().isBefore(today))
                                .filter(application -> !application.getInterviewDate().isAfter(interviewEnd))
                                .filter(application -> application
                                                .getStatus() == JobApplication.ApplicationStatus.INTERVIEW_SCHEDULED)
                                .map(JobApplication::getInterviewDate)
                                .collect(Collectors.toSet())
                                .size();

                LocalDate closingSoonEnd = today.plusDays(7);
                int jobsClosingSoon = jobPostingRepository.findByStatus(
                                PostingStatus.OPEN,
                                PageRequest.of(0, 1000, Sort.by(Sort.Direction.ASC, "applicationDeadline")))
                                .getContent()
                                .stream()
                                .filter(job -> job.getApplicationDeadline() != null)
                                .filter(job -> !job.getApplicationDeadline().isBefore(today))
                                .filter(job -> !job.getApplicationDeadline().isAfter(closingSoonEnd))
                                .collect(Collectors.toList())
                                .size();

                ChatbotDTOs.RecruitmentSummaryItem summary = new ChatbotDTOs.RecruitmentSummaryItem(
                                totalJobs,
                                openJobs,
                                draftJobs,
                                onHoldJobs,
                                closedJobs,
                                totalApplications,
                                applied,
                                shortlisted,
                                interviewScheduled,
                                interviewed,
                                offerSent,
                                offerAccepted,
                                offerRejected,
                                rejected,
                                withdrawn,
                                upcomingInterviews,
                                jobsClosingSoon,
                                today);

                String reply = buildRecruitmentSummaryReply(summary, message);

                ChatbotDTOs.MessageResponse response = createResponse(
                                reply,
                                "RECRUITMENT_SUMMARY",
                                "RECRUITMENT",
                                null,
                                null,
                                null);

                response.setRecruitmentSummary(summary);
                return response;
        }

        private int countApplications(JobApplication.ApplicationStatus status) {
                return (int) jobApplicationRepository.countByStatus(status);
        }

        private String buildRecruitmentSummaryReply(
                        ChatbotDTOs.RecruitmentSummaryItem summary,
                        String message) {

                if (containsAny(message, "shortlisted", "how many shortlisted")) {
                        return "There are **" + summary.getShortlistedCount() +
                                        "** shortlisted candidates currently in the recruitment pipeline. 👥";
                }

                if (containsAny(message, "interviews scheduled", "interview scheduled", "upcoming interviews")) {
                        return "There are **" + summary.getInterviewScheduledCount() +
                                        "** applications with interviews scheduled. " +
                                        "I found **" + summary.getUpcomingInterviewsCount() +
                                        "** upcoming interview records for the next 7 days. 📅";
                }

                if (containsAny(message, "offers accepted")) {
                        return "There are **" + summary.getOfferAcceptedCount() +
                                        "** accepted offers in the recruitment pipeline. ✅";
                }

                if (containsAny(message, "offers sent")) {
                        return "There are **" + summary.getOfferSentCount() +
                                        "** offers currently marked as sent. 📩";
                }

                if (containsAny(message, "jobs closing soon", "job closing soon", "positions closing soon")) {
                        return "There are **" + summary.getJobsClosingSoonCount() +
                                        "** open positions with application deadlines in the next 7 days. ⏳";
                }

                return "Here is the current recruitment overview as of **" +
                                summary.getAsOfDate() + "**: 📊\n\n" +
                                "💼 **Jobs**\n" +
                                "• Total jobs: **" + summary.getTotalJobs() + "**\n" +
                                "• Open positions: **" + summary.getOpenPositions() + "**\n" +
                                "• Draft: **" + summary.getDraftJobs() + "**\n" +
                                "• On hold: **" + summary.getOnHoldJobs() + "**\n" +
                                "• Closed: **" + summary.getClosedJobs() + "**\n\n" +
                                "👥 **Application Pipeline**\n" +
                                "• Total applications: **" + summary.getTotalApplications() + "**\n" +
                                "• Applied: **" + summary.getAppliedCount() + "**\n" +
                                "• Shortlisted: **" + summary.getShortlistedCount() + "**\n" +
                                "• Interviews scheduled: **" + summary.getInterviewScheduledCount() + "**\n" +
                                "• Interviewed: **" + summary.getInterviewedCount() + "**\n" +
                                "• Offers sent: **" + summary.getOfferSentCount() + "**\n" +
                                "• Offers accepted: **" + summary.getOfferAcceptedCount() + "**\n" +
                                "• Offers rejected: **" + summary.getOfferRejectedCount() + "**\n" +
                                "• Rejected: **" + summary.getRejectedCount() + "**\n" +
                                "• Withdrawn: **" + summary.getWithdrawnCount() + "**\n\n" +
                                "📅 **Upcoming Activity**\n" +
                                "• Upcoming interviews (next 7 days): **" + summary.getUpcomingInterviewsCount()
                                + "**\n" +
                                "• Jobs closing soon (next 7 days): **" + summary.getJobsClosingSoonCount() + "**";
        }

        private boolean isRecruitmentQuestion(String message) {
                if (message == null || message.isBlank()) {
                        return false;
                }

                return containsAny(
                                message,
                                "recruitment",
                                "recruiting",
                                "job opening",
                                "job openings",
                                "job vacancy",
                                "job vacancies",
                                "vacancy",
                                "vacancies",
                                "open position",
                                "open positions",
                                "available jobs",
                                "available positions",
                                "job opportunity",
                                "job opportunities",
                                "hiring",
                                "career opening",
                                "career openings",
                                "show jobs",
                                "show me jobs",
                                "find jobs",
                                "my referrals",
                                "my referral",
                                "referred candidates",
                                "candidate referrals",
                                "job requirements",
                                "job description",
                                "experience required",
                                "salary range",
                                "application deadline",
                                "job deadline",
                                "job location",
                                "employment type");
        }

        private boolean isMyReferralsQuestion(String message) {
                return containsAny(
                                message,
                                "my referrals",
                                "my referral",
                                "referred candidates",
                                "candidate referrals",
                                "candidates i referred",
                                "people i referred");
        }

        private String resolveRecruitmentIntent(String message) {
                if (isMyReferralsQuestion(message)) {
                        return "MY_REFERRALS";
                }

                if (containsAny(message,
                                "requirement",
                                "requirements",
                                "qualification",
                                "qualifications",
                                "skills required",
                                "what skills")) {
                        return "JOB_REQUIREMENTS";
                }

                if (containsAny(message,
                                "salary",
                                "ctc",
                                "pay range",
                                "salary range",
                                "package")) {
                        return "JOB_SALARY";
                }

                if (containsAny(message,
                                "deadline",
                                "last date",
                                "closing date",
                                "application deadline")) {
                        return "JOB_DEADLINE";
                }

                if (containsAny(message,
                                "location",
                                "where is",
                                "where are",
                                "city")) {
                        return "JOB_LOCATION";
                }

                if (containsAny(message,
                                "details",
                                "description",
                                "tell me about",
                                "more about",
                                "job information",
                                "job info")) {
                        return "JOB_DETAILS";
                }

                if (containsAny(message,
                                "recruitment status",
                                "hiring status",
                                "recruitment update")) {
                        return "RECRUITMENT_STATUS";
                }

                return "OPEN_JOBS";
        }

        private boolean matchesJobFilter(
                        JobPosting job,
                        String message,
                        String requestedTitle,
                        String requestedDepartment,
                        String requestedLocation) {

                String searchable = (safeValue(job.getTitle()) + " " +
                                safeValue(job.getDepartment()) + " " +
                                safeValue(job.getLocation()) + " " +
                                safeValue(job.getEmploymentType()) + " " +
                                safeValue(job.getDescription()) + " " +
                                safeValue(job.getRequirements()) + " " +
                                safeValue(job.getExperienceRequired()))
                                .toLowerCase(Locale.ROOT);

                if (requestedTitle != null && !searchable.contains(requestedTitle)) {
                        return false;
                }

                if (requestedDepartment != null && !searchable.contains(requestedDepartment)) {
                        return false;
                }

                if (requestedLocation != null && !searchable.contains(requestedLocation)) {
                        return false;
                }

                // Generic keyword search. This lets questions such as
                // "show Java jobs" or "frontend jobs" work without adding
                // repository methods for every possible technology.
                List<String> ignored = List.of(
                                "show", "me", "my", "the", "all", "available", "open",
                                "jobs", "job", "openings", "opening", "positions", "position",
                                "vacancies", "vacancy", "please", "give", "tell", "about",
                                "what", "are", "is", "any", "find", "available", "current",
                                "currently", "recruitment", "hiring", "status", "details",
                                "information", "info", "requirements", "requirement", "skills",
                                "salary", "range", "ctc", "package", "deadline", "application",
                                "location", "where", "employment", "type", "myreferrals");

                String[] words = message.toLowerCase(Locale.ROOT).split("\\s+");
                for (String raw : words) {
                        String word = raw.replaceAll("[^a-z0-9+.#-]", "");
                        if (word.length() < 3 || ignored.contains(word)) {
                                continue;
                        }

                        if (searchable.contains(word)) {
                                return true;
                        }

                        // If the message contains a meaningful search term that does
                        // not occur in this job, exclude it from the result.
                        if (message.contains("java") || message.contains("frontend") ||
                                        message.contains("backend") || message.contains("developer") ||
                                        message.contains("engineer") || message.contains("react") ||
                                        message.contains("python") || message.contains("sql") ||
                                        message.contains("android") || message.contains("data analyst")) {
                                return false;
                        }
                }

                return true;
        }

        private String extractJobTitle(String message) {
                String[] knownTitles = {
                                "software engineer", "software developer", "java developer",
                                "frontend developer", "front end developer", "backend developer",
                                "full stack developer", "full-stack developer", "android developer",
                                "data analyst", "qa engineer", "test engineer", "associate software engineer"
                };

                for (String title : knownTitles) {
                        if (message.contains(title)) {
                                return title;
                        }
                }
                return null;
        }

        private String extractJobDepartment(String message) {
                String[] departments = {
                                "engineering", "it", "information technology", "hr",
                                "human resources", "finance", "sales", "marketing",
                                "operations", "development", "quality assurance"
                };
                for (String department : departments) {
                        if (message.contains(department)) {
                                return department;
                        }
                }
                return null;
        }

        private String extractJobLocation(String message) {
                // Location is primarily handled by the generic searchable text.
                // These common location phrases make the intent more explicit.
                String[] locations = {
                                "hyderabad", "bangalore", "bengaluru", "chennai", "mumbai",
                                "pune", "delhi", "noida", "gurgaon", "gurugram", "vijayawada",
                                "tirupati", "eluru", "remote", "hybrid", "onsite", "on-site"
                };
                for (String location : locations) {
                        if (message.contains(location)) {
                                return location;
                        }
                }
                return null;
        }

        private Long extractJobId(String message) {
                if (!containsAny(message, "job id", "job #", "job number", "job posting")) {
                        return null;
                }

                java.util.regex.Matcher matcher = java.util.regex.Pattern
                                .compile("(?:job\\s*(?:id|number)?|posting)\\s*#?\\s*(\\d+)")
                                .matcher(message);

                if (matcher.find()) {
                        try {
                                return Long.valueOf(matcher.group(1));
                        } catch (NumberFormatException ignored) {
                                return null;
                        }
                }
                return null;
        }

        private String buildRecruitmentReply(
                        List<ChatbotDTOs.JobItem> items,
                        String message,
                        String intent) {

                if (items.isEmpty()) {
                        return "I couldn't find any open job openings matching your request right now. 💼\\n\\n" +
                                        "Try asking:\\n" +
                                        "• Show me open jobs\\n" +
                                        "• Show Java jobs\\n" +
                                        "• Show frontend jobs\\n" +
                                        "• Show jobs in Hyderabad";
                }

                if (items.size() == 1) {
                        return buildSingleJobReply(items.get(0), intent);
                }

                StringBuilder reply = new StringBuilder();

                switch (intent) {
                        case "JOB_REQUIREMENTS" ->
                                reply.append("Here are the matching open positions and their requirements: 💼\\n\\n");
                        case "JOB_SALARY" ->
                                reply.append("Here are the matching open positions and salary information: 💰\\n\\n");
                        case "JOB_DEADLINE" ->
                                reply.append("Here are the matching open positions and application deadlines: 📅\\n\\n");
                        case "JOB_LOCATION" ->
                                reply.append("Here are the matching open positions by location: 📍\\n\\n");
                        default -> reply.append("Here are the current open job opportunities: 💼\\n\\n");
                }

                for (int i = 0; i < items.size(); i++) {
                        ChatbotDTOs.JobItem item = items.get(i);
                        reply.append(i + 1)
                                        .append(". **")
                                        .append(safeValue(item.getTitle()))
                                        .append("**\\n")
                                        .append("   Department: **")
                                        .append(safeValue(item.getDepartment()))
                                        .append("**\\n")
                                        .append("   Location: **")
                                        .append(safeValue(item.getLocation()))
                                        .append("**\\n")
                                        .append("   Type: **")
                                        .append(formatEmploymentType(item.getEmploymentType()))
                                        .append("**\\n")
                                        .append("   Experience: **")
                                        .append(safeValue(item.getExperienceRequired()))
                                        .append("**\\n")
                                        .append("   Salary: **")
                                        .append(safeValue(item.getSalaryRange()))
                                        .append("**\\n")
                                        .append("   Deadline: **")
                                        .append(formatDate(item.getApplicationDeadline()))
                                        .append("**\\n\\n");
                }

                if (items.size() == 20) {
                        reply.append("Showing the latest 20 matching open positions.");
                }

                return reply.toString().trim();
        }

        private String buildSingleJobReply(
                        ChatbotDTOs.JobItem item,
                        String intent) {

                StringBuilder reply = new StringBuilder();

                reply.append("Here are the details for **")
                                .append(safeValue(item.getTitle()))
                                .append("**: 💼\\n\\n");

                if ("JOB_REQUIREMENTS".equals(intent)) {
                        reply.append("Requirements: **")
                                        .append(safeValue(item.getRequirements()))
                                        .append("**");
                        return reply.toString();
                }

                if ("JOB_SALARY".equals(intent)) {
                        reply.append("Salary range: **")
                                        .append(safeValue(item.getSalaryRange()))
                                        .append("**");
                        return reply.toString();
                }

                if ("JOB_DEADLINE".equals(intent)) {
                        reply.append("Application deadline: **")
                                        .append(formatDate(item.getApplicationDeadline()))
                                        .append("**");
                        return reply.toString();
                }

                if ("JOB_LOCATION".equals(intent)) {
                        reply.append("Location: **")
                                        .append(safeValue(item.getLocation()))
                                        .append("**");
                        return reply.toString();
                }

                reply.append("Department: **")
                                .append(safeValue(item.getDepartment()))
                                .append("**\\n")
                                .append("Location: **")
                                .append(safeValue(item.getLocation()))
                                .append("**\\n")
                                .append("Employment type: **")
                                .append(formatEmploymentType(item.getEmploymentType()))
                                .append("**\\n")
                                .append("Experience: **")
                                .append(safeValue(item.getExperienceRequired()))
                                .append("**\\n")
                                .append("Salary: **")
                                .append(safeValue(item.getSalaryRange()))
                                .append("**\\n")
                                .append("Application deadline: **")
                                .append(formatDate(item.getApplicationDeadline()))
                                .append("**\\n")
                                .append("Applications received: **")
                                .append(item.getApplicationCount())
                                .append("**\\n\\n")
                                .append("Description: **")
                                .append(safeValue(item.getDescription()))
                                .append("**\\n\\n")
                                .append("Requirements: **")
                                .append(safeValue(item.getRequirements()))
                                .append("**");

                return reply.toString();
        }

        private ChatbotDTOs.JobItem toJobItem(JobPosting job) {
                return new ChatbotDTOs.JobItem(
                                job.getId(),
                                job.getTitle(),
                                job.getDepartment(),
                                job.getLocation(),
                                job.getEmploymentType(),
                                job.getDescription(),
                                job.getRequirements(),
                                job.getExperienceRequired(),
                                job.getSalaryRange(),
                                job.getApplicationDeadline(),
                                job.getStatus() != null ? job.getStatus().name() : null,
                                (int) jobApplicationRepository.countByJobPosting(job),
                                job.getCreatedAt());
        }

        private ChatbotDTOs.RecruitmentApplicationItem toRecruitmentApplicationItem(
                        JobApplication application) {

                return new ChatbotDTOs.RecruitmentApplicationItem(
                                application.getId(),
                                application.getJobPosting() != null ? application.getJobPosting().getId() : null,
                                application.getJobPosting() != null ? application.getJobPosting().getTitle() : null,
                                application.getJobPosting() != null ? application.getJobPosting().getDepartment()
                                                : null,
                                application.getCandidateName(),
                                application.getExperienceYears(),
                                application.getExperienceMonths(),
                                application.getStatus() != null ? application.getStatus().name() : null,
                                application.getInterviewDate(),
                                application.getInterviewMode(),
                                application.getInterviewScore(),
                                application.getInterviewer() != null
                                                ? buildFullName(
                                                                application.getInterviewer().getFirstName(),
                                                                application.getInterviewer().getLastName())
                                                : null,
                                application.getRejectionReason(),
                                application.getAppliedAt());
        }

        private String formatApplicationStatus(String status) {
                if (status == null || status.isBlank()) {
                        return "Not available";
                }

                return formatDisplayText(status);
        }

        private String formatEmploymentType(String value) {
                if (value == null || value.isBlank()) {
                        return "Not available";
                }

                return formatDisplayText(value);
        }

        private String formatDisplayText(String value) {
                if (value == null || value.isBlank()) {
                        return "Not available";
                }

                String normalized = value
                                .replace('_', ' ')
                                .replace('-', ' ')
                                .trim()
                                .toLowerCase(Locale.ROOT);

                StringBuilder result = new StringBuilder();

                for (String word : normalized.split("\\s+")) {
                        if (word.isEmpty()) {
                                continue;
                        }

                        if (result.length() > 0) {
                                result.append(' ');
                        }

                        result.append(Character.toUpperCase(word.charAt(0)));

                        if (word.length() > 1) {
                                result.append(word.substring(1));
                        }
                }

                return result.toString();
        }

        private String formatExperience(Integer years, Integer months) {
                if (years == null && months == null) {
                        return "Not available";
                }
                int y = years != null ? years : 0;
                int m = months != null ? months : 0;
                if (y == 0 && m == 0)
                        return "0 months";
                if (m == 0)
                        return y + (y == 1 ? " year" : " years");
                if (y == 0)
                        return m + (m == 1 ? " month" : " months");
                return y + (y == 1 ? " year " : " years ") + m + (m == 1 ? " month" : " months");
        }

        // =========================================================
        // PAYROLL / PAYSLIP
        // =========================================================

        private ChatbotDTOs.MessageResponse getPayrollResponse(
                        Employee employee,
                        String message) {

                List<PayrollDTOs.Response> payrolls = getEmployeePayrollHistory(employee);

                if (payrolls.isEmpty()) {
                        return createPayrollResponse(
                                        "I couldn't find any payroll records for your account yet. 💰",
                                        "PAYROLL_NOT_FOUND",
                                        null,
                                        List.of());
                }

                // ---------------------------------------------------------
                // Specific month request
                // ---------------------------------------------------------

                YearMonth requestedMonth = extractPayrollMonth(message);

                if (requestedMonth != null) {
                        Optional<PayrollDTOs.Response> matching = payrolls.stream()
                                        .filter(p -> p.getMonth() == requestedMonth.getMonthValue()
                                                        && p.getYear() == requestedMonth.getYear())
                                        .findFirst();

                        if (matching.isEmpty()) {
                                List<ChatbotDTOs.PayrollItem> payrollItems = payrolls.stream()
                                                .map(this::toPayrollItem)
                                                .collect(Collectors.toList());

                                return createPayrollResponse(
                                                "I couldn't find a payroll record for "
                                                                + formatPayrollMonth(requestedMonth) + ".",
                                                "PAYROLL_MONTH_NOT_FOUND",
                                                null,
                                                payrollItems);
                        }

                        PayrollDTOs.Response payroll = matching.get();
                        return createPayrollResponse(
                                        buildPayrollReply(payroll, message),
                                        "PAYROLL_MONTH",
                                        toPayrollItem(payroll),
                                        List.of(toPayrollItem(payroll)));
                }

                // ---------------------------------------------------------
                // History request
                // ---------------------------------------------------------

                if (isPayrollHistoryQuestion(message)) {
                        List<ChatbotDTOs.PayrollItem> items = payrolls.stream()
                                        .map(this::toPayrollItem)
                                        .collect(Collectors.toList());

                        return createPayrollResponse(
                                        buildPayrollHistoryReply(items),
                                        "PAYROLL_HISTORY",
                                        null,
                                        items);
                }

                // ---------------------------------------------------------
                // Latest payroll / salary questions
                // ---------------------------------------------------------

                PayrollDTOs.Response latest = payrolls.get(0);
                ChatbotDTOs.PayrollItem latestItem = toPayrollItem(latest);

                return createPayrollResponse(
                                buildPayrollReply(latest, message),
                                resolvePayrollIntent(message),
                                latestItem,
                                List.of(latestItem));
        }

        private List<PayrollDTOs.Response> getEmployeePayrollHistory(
                        Employee employee) {

                return payrollService.getByEmployee(
                                employee.getId(),
                                PageRequest.of(
                                                0,
                                                100,
                                                Sort.by(
                                                                Sort.Order.desc("year"),
                                                                Sort.Order.desc("month"))))
                                .getContent();
        }

        private String buildPayrollReply(
                        PayrollDTOs.Response payroll,
                        String message) {

                String period = formatPayrollMonth(
                                payroll.getMonth(),
                                payroll.getYear());

                if (containsAny(message,
                                "net salary",
                                "take home",
                                "take-home",
                                "take home salary",
                                "net pay")) {

                        return "Your net salary for **" + period + "** is **₹"
                                        + formatMoney(payroll.getNetSalary()) + "**. 💰";
                }

                if (containsAny(message,
                                "gross salary",
                                "gross pay")) {

                        return "Your gross salary for **" + period + "** is **₹"
                                        + formatMoney(payroll.getGrossSalary()) + "**.";
                }

                if (containsAny(message,
                                "basic salary",
                                "basic pay")) {

                        return "Your basic salary for **" + period + "** is **₹"
                                        + formatMoney(payroll.getBasicSalary()) + "**.";
                }

                if (containsAny(message,
                                "hra",
                                "house rent allowance")) {

                        return "Your HRA for **" + period + "** is **₹"
                                        + formatMoney(payroll.getHra()) + "**.";
                }

                if (containsAny(message,
                                "da",
                                "dearness allowance")) {

                        return "Your DA for **" + period + "** is **₹"
                                        + formatMoney(payroll.getDa()) + "**.";
                }

                if (containsAny(message,
                                "special allowance")) {

                        return "Your special allowance for **" + period + "** is **₹"
                                        + formatMoney(payroll.getSpecialAllowance()) + "**.";
                }

                if (containsAny(message,
                                "deduction",
                                "deductions",
                                "deducted",
                                "how much was deducted")) {

                        return "Your total deductions for **" + period + "** are **₹"
                                        + formatMoney(payroll.getTotalDeductions()) + "**.\n\n"
                                        + "ESI: **₹" + formatMoney(payroll.getEsi()) + "**\n"
                                        + "TDS: **₹" + formatMoney(payroll.getTds()) + "**";
                }

                if (containsAny(message,
                                "esi")) {

                        return "Your ESI deduction for **" + period + "** is **₹"
                                        + formatMoney(payroll.getEsi()) + "**.";
                }

                if (containsAny(message,
                                "tds",
                                "tax deducted",
                                "income tax")) {

                        return "Your TDS for **" + period + "** is **₹"
                                        + formatMoney(payroll.getTds()) + "**.";
                }

                if (containsAny(message,
                                "lop",
                                "loss of pay",
                                "loss-of-pay")) {

                        return "Your LOP days for **" + period + "** are **"
                                        + payroll.getLopDays() + " day(s)**.";
                }

                if (containsAny(message,
                                "present days",
                                "days present",
                                "how many days was i present")) {

                        return "You were marked present for **"
                                        + payroll.getPresentDays() + " day(s)** in **"
                                        + period + "**.";
                }

                if (containsAny(message,
                                "paid",
                                "salary paid",
                                "pay date",
                                "payment date")) {

                        if (payroll.isPaid()) {
                                return "Your salary for **" + period + "** has been **paid**. ✅\n\n"
                                                + "Pay date: **"
                                                + (payroll.getPayDate() != null
                                                                ? payroll.getPayDate()
                                                                : "Not available")
                                                + "**";
                        }

                        return "Your salary for **" + period + "** is currently **not marked as paid**. ⏳";
                }

                return "Here is your latest payroll for **" + period + ":** 💰\n\n"
                                + "Basic salary: **₹" + formatMoney(payroll.getBasicSalary()) + "**\n"
                                + "HRA: **₹" + formatMoney(payroll.getHra()) + "**\n"
                                + "DA: **₹" + formatMoney(payroll.getDa()) + "**\n"
                                + "Special allowance: **₹" + formatMoney(payroll.getSpecialAllowance()) + "**\n"
                                + "Gross salary: **₹" + formatMoney(payroll.getGrossSalary()) + "**\n"
                                + "Total deductions: **₹" + formatMoney(payroll.getTotalDeductions()) + "**\n"
                                + "Net salary: **₹" + formatMoney(payroll.getNetSalary()) + "**\n"
                                + "Status: **" + (payroll.isPaid() ? "Paid" : "Not Paid") + "**";
        }

        private String buildPayrollHistoryReply(
                        List<ChatbotDTOs.PayrollItem> items) {

                StringBuilder reply = new StringBuilder(
                                "Here is your payroll history: 👇\n\n");

                int limit = Math.min(items.size(), 12);

                for (int i = 0; i < limit; i++) {
                        ChatbotDTOs.PayrollItem item = items.get(i);

                        reply.append(i + 1)
                                        .append(". **")
                                        .append(formatPayrollMonth(item.getMonth(), item.getYear()))
                                        .append("**\n")
                                        .append("   Gross: **₹")
                                        .append(formatMoney(item.getGrossSalary()))
                                        .append("**\n")
                                        .append("   Deductions: **₹")
                                        .append(formatMoney(item.getTotalDeductions()))
                                        .append("**\n")
                                        .append("   Net: **₹")
                                        .append(formatMoney(item.getNetSalary()))
                                        .append("**\n")
                                        .append("   Status: **")
                                        .append(item.isPaid() ? "Paid" : "Not Paid")
                                        .append("**\n\n");
                }

                if (items.size() > limit) {
                        reply.append("Showing the latest ")
                                        .append(limit)
                                        .append(" payroll records.");
                }

                return reply.toString().trim();
        }

        private ChatbotDTOs.PayrollItem toPayrollItem(
                        PayrollDTOs.Response payroll) {

                return new ChatbotDTOs.PayrollItem(
                                payroll.getId(),
                                payroll.getEmployeeDbId(),
                                payroll.getEmployeeName(),
                                payroll.getEmployeeCode(),
                                payroll.getMonth(),
                                payroll.getYear(),
                                payroll.getBasicSalary(),
                                payroll.getHra(),
                                payroll.getDa(),
                                payroll.getSpecialAllowance(),
                                payroll.getGrossSalary(),
                                payroll.getEsi(),
                                payroll.getTds(),
                                payroll.getTotalDeductions(),
                                payroll.getNetSalary(),
                                payroll.getPresentDays(),
                                payroll.getLopDays(),
                                payroll.isPaid(),
                                payroll.getPayDate());
        }

        private ChatbotDTOs.MessageResponse createPayrollResponse(
                        String reply,
                        String intent,
                        ChatbotDTOs.PayrollItem payroll,
                        List<ChatbotDTOs.PayrollItem> payrollHistory) {

                return new ChatbotDTOs.MessageResponse(
                                reply,
                                intent,
                                "PAYROLL",
                                null,
                                null,
                                null,
                                null,
                                payroll,
                                payrollHistory,
                                LocalDateTime.now());
        }

        private boolean isPayrollQuestion(String message) {

                if (message == null || message.isBlank()) {
                        return false;
                }

                boolean payrollKeyword = containsAny(
                                message,
                                "payroll",
                                "payslip",
                                "pay slip",
                                "salary",
                                "pay statement",
                                "salary statement",
                                "earnings");

                boolean payrollDetail = containsAny(
                                message,
                                "basic salary",
                                "basic pay",
                                "gross salary",
                                "gross pay",
                                "net salary",
                                "net pay",
                                "take home",
                                "take-home",
                                "hra",
                                "dearness allowance",
                                "special allowance",
                                "deduction",
                                "deductions",
                                "esi",
                                "tds",
                                "lop",
                                "loss of pay",
                                "pay date",
                                "salary paid",
                                "paid salary");

                return payrollKeyword || payrollDetail;
        }

        private boolean isPayrollHistoryQuestion(String message) {
                return containsAny(
                                message,
                                "payroll history",
                                "salary history",
                                "payslip history",
                                "pay slip history",
                                "past payroll",
                                "past salary",
                                "past payslips",
                                "my payroll records",
                                "my salary records",
                                "salary records",
                                "payroll records");
        }

        private String resolvePayrollIntent(String message) {

                if (containsAny(message, "net salary", "net pay", "take home", "take-home")) {
                        return "PAYROLL_NET_SALARY";
                }
                if (containsAny(message, "gross salary", "gross pay")) {
                        return "PAYROLL_GROSS_SALARY";
                }
                if (containsAny(message, "basic salary", "basic pay")) {
                        return "PAYROLL_BASIC_SALARY";
                }
                if (containsAny(message, "deduction", "deductions", "deducted")) {
                        return "PAYROLL_DEDUCTIONS";
                }
                if (containsAny(message, "paid", "pay date", "payment date")) {
                        return "PAYROLL_PAYMENT_STATUS";
                }
                return "PAYROLL_LATEST";
        }

        private YearMonth extractPayrollMonth(String message) {

                int currentYear = LocalDate.now(IST_ZONE).getYear();

                String[] months = {
                                "january", "february", "march", "april", "may", "june",
                                "july", "august", "september", "october", "november", "december"
                };

                for (int i = 0; i < months.length; i++) {
                        if (message.contains(months[i])) {
                                int year = extractFourDigitYear(message).orElse(currentYear);
                                return YearMonth.of(year, i + 1);
                        }
                }

                // Numeric formats: 08/2026, 08-2026, 08 2026
                java.util.regex.Matcher matcher = java.util.regex.Pattern
                                .compile("\\b(0?[1-9]|1[0-2])[\\s/.-](20\\d{2})\\b")
                                .matcher(message);

                if (matcher.find()) {
                        return YearMonth.of(
                                        Integer.parseInt(matcher.group(2)),
                                        Integer.parseInt(matcher.group(1)));
                }

                return null;
        }

        private Optional<Integer> extractFourDigitYear(String message) {

                java.util.regex.Matcher matcher = java.util.regex.Pattern
                                .compile("\\b(20\\d{2})\\b")
                                .matcher(message);

                if (matcher.find()) {
                        return Optional.of(Integer.parseInt(matcher.group(1)));
                }

                return Optional.empty();
        }

        private String formatPayrollMonth(int month, int year) {
                if (month < 1 || month > 12) {
                        return String.valueOf(year);
                }

                return Month.of(month).name().charAt(0)
                                + Month.of(month).name().substring(1).toLowerCase(Locale.ROOT)
                                + " " + year;
        }

        private String formatPayrollMonth(YearMonth yearMonth) {
                return formatPayrollMonth(
                                yearMonth.getMonthValue(),
                                yearMonth.getYear());
        }

        private String formatMoney(BigDecimal value) {
                if (value == null) {
                        return "0.00";
                }

                return value.setScale(2, java.math.RoundingMode.HALF_UP)
                                .toPlainString();
        }

        // =========================================================
        // ATTENDANCE ANALYTICS
        // =========================================================

        private ChatbotDTOs.MessageResponse getAttendanceAnalyticsResponse(
                        Employee employee,
                        String message) {

                LocalDate today = LocalDate.now(IST_ZONE);

                AttendanceDTOs.EmployeeDetailedReport report = attendanceService.getEmployeeDetailedReport(
                                employee.getId(),
                                today);

                ChatbotDTOs.AttendanceAnalyticsItem analytics = buildAnalyticsItem(report);

                // =====================================================
                // YESTERDAY
                // =====================================================

                if (isYesterdayQuestion(message)) {

                        return createResponse(
                                        buildYesterdayReply(analytics),
                                        "ATTENDANCE_YESTERDAY",
                                        "ATTENDANCE_ANALYTICS",
                                        null,
                                        null,
                                        analytics);
                }

                // =====================================================
                // WEEKLY
                // =====================================================

                if (isWeeklyAttendanceQuestion(message)) {

                        return createResponse(
                                        buildWeeklyReply(analytics),
                                        "ATTENDANCE_WEEKLY",
                                        "ATTENDANCE_ANALYTICS",
                                        null,
                                        null,
                                        analytics);
                }

                // =====================================================
                // MONTHLY
                // =====================================================

                if (isMonthlyAttendanceQuestion(message)) {

                        return createResponse(
                                        buildMonthlyReply(analytics),
                                        "ATTENDANCE_MONTHLY",
                                        "ATTENDANCE_ANALYTICS",
                                        null,
                                        null,
                                        analytics);
                }

                // =====================================================
                // ATTENDANCE PERCENTAGE
                // =====================================================

                if (isAttendancePercentageQuestion(message)) {

                        return createResponse(
                                        buildAttendancePercentageReply(analytics),
                                        "ATTENDANCE_PERCENTAGE",
                                        "ATTENDANCE_ANALYTICS",
                                        null,
                                        null,
                                        analytics);
                }

                // =====================================================
                // PRESENT DAYS
                // =====================================================

                if (isPresentDaysQuestion(message)) {

                        return createResponse(
                                        buildPresentDaysReply(analytics, message),
                                        "ATTENDANCE_PRESENT_DAYS",
                                        "ATTENDANCE_ANALYTICS",
                                        null,
                                        null,
                                        analytics);
                }

                // =====================================================
                // ABSENT DAYS
                // =====================================================

                if (isAbsentDaysQuestion(message)) {

                        return createResponse(
                                        buildAbsentDaysReply(analytics, message),
                                        "ATTENDANCE_ABSENT_DAYS",
                                        "ATTENDANCE_ANALYTICS",
                                        null,
                                        null,
                                        analytics);
                }

                // =====================================================
                // HALF DAYS
                // =====================================================

                if (isHalfDayQuestion(message)) {

                        return createResponse(
                                        buildHalfDayReply(analytics, message),
                                        "ATTENDANCE_HALF_DAYS",
                                        "ATTENDANCE_ANALYTICS",
                                        null,
                                        null,
                                        analytics);
                }

                // =====================================================
                // TOTAL HOURS
                // =====================================================

                if (isTotalHoursQuestion(message)) {

                        return createResponse(
                                        buildTotalHoursReply(analytics, message),
                                        "ATTENDANCE_TOTAL_HOURS",
                                        "ATTENDANCE_ANALYTICS",
                                        null,
                                        null,
                                        analytics);
                }

                // =====================================================
                // AVERAGE HOURS
                // =====================================================

                if (isAverageHoursQuestion(message)) {

                        return createResponse(
                                        buildAverageHoursReply(analytics),
                                        "ATTENDANCE_AVERAGE_HOURS",
                                        "ATTENDANCE_ANALYTICS",
                                        null,
                                        null,
                                        analytics);
                }

                // =====================================================
                // GENERAL ANALYTICS
                // =====================================================

                return createResponse(
                                buildGeneralAnalyticsReply(analytics),
                                "ATTENDANCE_ANALYTICS",
                                "ATTENDANCE_ANALYTICS",
                                null,
                                null,
                                analytics);
        }

        // =========================================================
        // BUILD ANALYTICS DTO
        // =========================================================

        private ChatbotDTOs.AttendanceAnalyticsItem buildAnalyticsItem(
                        AttendanceDTOs.EmployeeDetailedReport report) {

                ChatbotDTOs.AttendanceAnalyticsItem item = new ChatbotDTOs.AttendanceAnalyticsItem();

                LocalDate today = LocalDate.now(IST_ZONE);

                item.setAsOfDate(today);

                // -----------------------------------------------------
                // Yesterday
                // -----------------------------------------------------

                item.setYesterdayDate(
                                report.getYesterdayDate());

                item.setYesterdayStatus(
                                report.getYesterdayStatus());

                item.setYesterdayCheckIn(
                                report.getYesterdayCheckIn());

                item.setYesterdayCheckOut(
                                report.getYesterdayCheckOut());

                item.setYesterdayWorkHours(
                                report.getYesterdayWorkHours());

                item.setYesterdayRemarks(
                                report.getYesterdayRemarks());

                // -----------------------------------------------------
                // Weekly stats
                // -----------------------------------------------------

                if (report.getWeeklyStats() != null) {

                        item.setWeeklyPresentCount(
                                        report.getWeeklyStats().getPresentCount());

                        item.setWeeklyAbsentCount(
                                        report.getWeeklyStats().getAbsentCount());

                        item.setWeeklyHalfDayCount(
                                        report.getWeeklyStats().getHalfDayCount());

                        item.setWeeklyLeaveCount(
                                        report.getWeeklyStats().getLeaveCount());

                        item.setWeeklyAverageWorkHours(
                                        report.getWeeklyStats().getAvgWorkHours());

                        double weeklyTotal = calculateTotalWorkHours(
                                        report.getWeeklyRecords());

                        item.setWeeklyTotalWorkHours(
                                        roundTwo(weeklyTotal));
                }

                // -----------------------------------------------------
                // Monthly stats
                // -----------------------------------------------------

                if (report.getMonthlyStats() != null) {

                        item.setMonthlyWorkingDays(
                                        report.getMonthlyStats().getWorkingDays());

                        item.setMonthlyPresentCount(
                                        report.getMonthlyStats().getPresentCount());

                        item.setMonthlyAbsentCount(
                                        report.getMonthlyStats().getAbsentCount());

                        item.setMonthlyHalfDayCount(
                                        report.getMonthlyStats().getHalfDayCount());

                        item.setMonthlyLeaveCount(
                                        report.getMonthlyStats().getLeaveCount());

                        item.setMonthlyAttendancePercent(
                                        report.getMonthlyStats().getAttendancePercent());

                        item.setMonthlyTotalWorkHours(
                                        report.getMonthlyStats().getTotalWorkHours());
                }

                // -----------------------------------------------------
                // Daily records
                // -----------------------------------------------------

                List<ChatbotDTOs.DailyAttendanceItem> dailyRecords = new ArrayList<>();

                if (report.getWeeklyRecords() != null) {

                        for (AttendanceDTOs.DailyRecord record : report.getWeeklyRecords()) {

                                dailyRecords.add(
                                                new ChatbotDTOs.DailyAttendanceItem(
                                                                record.getDate(),
                                                                record.getDayName(),
                                                                record.getStatus(),
                                                                record.getCheckIn(),
                                                                record.getCheckOut(),
                                                                record.getWorkHours(),
                                                                record.getTotalBreakMinutes(),
                                                                record.getRemarks()));
                        }
                }

                item.setDailyRecords(dailyRecords);

                // -----------------------------------------------------
                // Default period
                // -----------------------------------------------------

                item.setPeriod("WEEK");

                if (report.getWeeklyRecords() != null &&
                                !report.getWeeklyRecords().isEmpty()) {

                        item.setPeriodStart(
                                        report.getWeeklyRecords()
                                                        .get(0)
                                                        .getDate());

                        item.setPeriodEnd(
                                        report.getWeeklyRecords()
                                                        .get(report.getWeeklyRecords().size() - 1)
                                                        .getDate());
                }

                return item;
        }

        // =========================================================
        // YESTERDAY REPLY
        // =========================================================

        private String buildYesterdayReply(
                        ChatbotDTOs.AttendanceAnalyticsItem item) {

                StringBuilder reply = new StringBuilder();

                reply.append(
                                "Here is your attendance for yesterday (")
                                .append(item.getYesterdayDate())
                                .append("): 👇\n\n");

                reply.append("Status: **")
                                .append(
                                                formatStatus(
                                                                item.getYesterdayStatus()))
                                .append("**\n");

                reply.append("Check-in: **")
                                .append(
                                                formatTime(
                                                                item.getYesterdayCheckIn()))
                                .append("**\n");

                reply.append("Check-out: **")
                                .append(
                                                formatTime(
                                                                item.getYesterdayCheckOut()))
                                .append("**\n");

                reply.append("Work hours: **")
                                .append(
                                                item.getYesterdayWorkHours() != null
                                                                ? formatHours(
                                                                                item.getYesterdayWorkHours())
                                                                : "--")
                                .append("**");

                if (item.getYesterdayRemarks() != null &&
                                !item.getYesterdayRemarks().isBlank()) {

                        reply.append("\nRemarks: **")
                                        .append(item.getYesterdayRemarks())
                                        .append("**");
                }

                return reply.toString();
        }

        // =========================================================
        // WEEKLY REPLY
        // =========================================================

        private String buildWeeklyReply(
                        ChatbotDTOs.AttendanceAnalyticsItem item) {

                StringBuilder reply = new StringBuilder();

                reply.append(
                                "Here is your attendance summary for this week: 👇\n\n");

                if (item.getPeriodStart() != null &&
                                item.getPeriodEnd() != null) {

                        reply.append("Period: **")
                                        .append(item.getPeriodStart())
                                        .append(" → ")
                                        .append(item.getPeriodEnd())
                                        .append("**\n\n");
                }

                reply.append("🟢 Present: **")
                                .append(safeInt(item.getWeeklyPresentCount()))
                                .append(" day(s)**\n");

                reply.append("🔴 Absent: **")
                                .append(safeInt(item.getWeeklyAbsentCount()))
                                .append(" day(s)**\n");

                reply.append("🟡 Half Day: **")
                                .append(safeInt(item.getWeeklyHalfDayCount()))
                                .append(" day(s)**\n");

                reply.append("🔵 Leave: **")
                                .append(safeInt(item.getWeeklyLeaveCount()))
                                .append(" day(s)**\n");

                reply.append("⏱️ Total work hours: **")
                                .append(
                                                formatHours(
                                                                item.getWeeklyTotalWorkHours()))
                                .append(" hours**\n");

                reply.append("📊 Average work hours: **")
                                .append(
                                                formatHours(
                                                                item.getWeeklyAverageWorkHours()))
                                .append(" hours/day**");

                return reply.toString();
        }

        // =========================================================
        // MONTHLY REPLY
        // =========================================================

        private String buildMonthlyReply(
                        ChatbotDTOs.AttendanceAnalyticsItem item) {

                StringBuilder reply = new StringBuilder();

                LocalDate today = LocalDate.now(IST_ZONE);

                reply.append(
                                "Here is your attendance summary for ")
                                .append(today.getMonth().toString())
                                .append(" ")
                                .append(today.getYear())
                                .append(": 👇\n\n");

                reply.append("📅 Working days: **")
                                .append(safeInt(item.getMonthlyWorkingDays()))
                                .append("**\n");

                reply.append("🟢 Present: **")
                                .append(safeInt(item.getMonthlyPresentCount()))
                                .append(" day(s)**\n");

                reply.append("🔴 Absent: **")
                                .append(safeInt(item.getMonthlyAbsentCount()))
                                .append(" day(s)**\n");

                reply.append("🟡 Half Day: **")
                                .append(safeInt(item.getMonthlyHalfDayCount()))
                                .append(" day(s)**\n");

                reply.append("🔵 Leave: **")
                                .append(safeInt(item.getMonthlyLeaveCount()))
                                .append(" day(s)**\n");

                reply.append("📊 Attendance percentage: **")
                                .append(
                                                formatPercentage(
                                                                item.getMonthlyAttendancePercent()))
                                .append("%**\n");

                reply.append("⏱️ Total work hours: **")
                                .append(
                                                formatHours(
                                                                item.getMonthlyTotalWorkHours()))
                                .append(" hours**");

                return reply.toString();
        }

        // =========================================================
        // ATTENDANCE PERCENTAGE
        // =========================================================

        private String buildAttendancePercentageReply(
                        ChatbotDTOs.AttendanceAnalyticsItem item) {

                return "Your attendance percentage for this month is **" +
                                formatPercentage(
                                                item.getMonthlyAttendancePercent())
                                +
                                "%**. 📊\n\n" +

                                "Present: **" +
                                safeInt(item.getMonthlyPresentCount()) +
                                " day(s)**\n" +

                                "Half Day: **" +
                                safeInt(item.getMonthlyHalfDayCount()) +
                                " day(s)**\n" +

                                "Absent: **" +
                                safeInt(item.getMonthlyAbsentCount()) +
                                " day(s)**\n" +

                                "Working days: **" +
                                safeInt(item.getMonthlyWorkingDays()) +
                                "**";
        }

        // =========================================================
        // PRESENT DAYS
        // =========================================================

        private String buildPresentDaysReply(
                        ChatbotDTOs.AttendanceAnalyticsItem item,
                        String message) {

                if (containsAny(
                                message,
                                "this month",
                                "monthly",
                                "month")) {

                        return "You were marked **Present** for " +
                                        safeInt(item.getMonthlyPresentCount()) +
                                        " day(s) this month. 🟢";
                }

                return "You were marked **Present** for " +
                                safeInt(item.getWeeklyPresentCount()) +
                                " day(s) this week. 🟢";
        }

        // =========================================================
        // ABSENT DAYS
        // =========================================================

        private String buildAbsentDaysReply(
                        ChatbotDTOs.AttendanceAnalyticsItem item,
                        String message) {

                if (containsAny(
                                message,
                                "this month",
                                "monthly",
                                "month")) {

                        return "You were marked **Absent** for " +
                                        safeInt(item.getMonthlyAbsentCount()) +
                                        " day(s) this month. 🔴";
                }

                return "You were marked **Absent** for " +
                                safeInt(item.getWeeklyAbsentCount()) +
                                " day(s) this week. 🔴";
        }

        // =========================================================
        // HALF DAY
        // =========================================================

        private String buildHalfDayReply(
                        ChatbotDTOs.AttendanceAnalyticsItem item,
                        String message) {

                if (containsAny(
                                message,
                                "this month",
                                "monthly",
                                "month")) {

                        return "You had **" +
                                        safeInt(item.getMonthlyHalfDayCount()) +
                                        " half day(s)** this month. 🟡";
                }

                return "You had **" +
                                safeInt(item.getWeeklyHalfDayCount()) +
                                " half day(s)** this week. 🟡";
        }

        // =========================================================
        // TOTAL HOURS
        // =========================================================

        private String buildTotalHoursReply(
                        ChatbotDTOs.AttendanceAnalyticsItem item,
                        String message) {

                if (containsAny(
                                message,
                                "this month",
                                "monthly",
                                "month")) {

                        return "You have worked a total of **" +
                                        formatHours(
                                                        item.getMonthlyTotalWorkHours())
                                        +
                                        " hours** this month. ⏱️";
                }

                return "You have worked a total of **" +
                                formatHours(
                                                item.getWeeklyTotalWorkHours())
                                +
                                " hours** this week. ⏱️";
        }

        // =========================================================
        // AVERAGE HOURS
        // =========================================================

        private String buildAverageHoursReply(
                        ChatbotDTOs.AttendanceAnalyticsItem item) {

                return "Your average working time this week is **" +
                                formatHours(
                                                item.getWeeklyAverageWorkHours())
                                +
                                " hours per day**. ⏱️";
        }

        // =========================================================
        // GENERAL ANALYTICS
        // =========================================================

        private String buildGeneralAnalyticsReply(
                        ChatbotDTOs.AttendanceAnalyticsItem item) {

                StringBuilder reply = new StringBuilder();

                reply.append("Here is your attendance summary: 📊\n\n");

                reply.append("This week:\n");

                reply.append("🟢 Present: **")
                                .append(safeInt(item.getWeeklyPresentCount()))
                                .append("**\n");

                reply.append("🔴 Absent: **")
                                .append(safeInt(item.getWeeklyAbsentCount()))
                                .append("**\n");

                reply.append("🟡 Half Day: **")
                                .append(safeInt(item.getWeeklyHalfDayCount()))
                                .append("**\n");

                reply.append("⏱️ Total hours: **")
                                .append(formatHours(
                                                item.getWeeklyTotalWorkHours()))
                                .append("**\n\n");

                reply.append("This month:\n");

                reply.append("📊 Attendance: **")
                                .append(formatPercentage(
                                                item.getMonthlyAttendancePercent()))
                                .append("%**\n");

                reply.append("🟢 Present: **")
                                .append(safeInt(item.getMonthlyPresentCount()))
                                .append("**\n");

                reply.append("🔴 Absent: **")
                                .append(safeInt(item.getMonthlyAbsentCount()))
                                .append("**\n");

                reply.append("⏱️ Total hours: **")
                                .append(formatHours(
                                                item.getMonthlyTotalWorkHours()))
                                .append("**");

                return reply.toString();
        }

        // =========================================================
        // TODAY'S ATTENDANCE
        // =========================================================

        private ChatbotDTOs.MessageResponse getAttendanceResponse(
                        Employee employee,
                        String message) {

                LocalDate today = LocalDate.now(IST_ZONE);

                Optional<Attendance> attendance = attendanceRepository
                                .findByEmployeeAndDate(
                                                employee,
                                                today);

                // -----------------------------------------------------
                // No attendance record
                // -----------------------------------------------------

                if (attendance.isEmpty()) {

                        ChatbotDTOs.AttendanceItem item = new ChatbotDTOs.AttendanceItem(
                                        today,
                                        "ABSENT",
                                        null,
                                        null,
                                        0.0,
                                        0,
                                        false,
                                        null);

                        return createResponse(
                                        "You don't have an attendance record for today (" +
                                                        today +
                                                        ").\n\n" +
                                                        "Your current status is **Absent / Not Checked In**.",
                                        "ATTENDANCE_TODAY",
                                        "ATTENDANCE",
                                        null,
                                        item,
                                        null);
                }

                Attendance att = attendance.get();

                ChatbotDTOs.AttendanceItem item = new ChatbotDTOs.AttendanceItem(
                                att.getDate(),
                                att.getStatus() != null
                                                ? att.getStatus().name()
                                                : "UNKNOWN",
                                att.getCheckIn(),
                                att.getCheckOut(),
                                att.getWorkHours(),
                                att.getTotalBreakMinutes(),
                                hasOpenBreak(att),
                                att.getRemarks());

                String reply = buildAttendanceReply(
                                att,
                                message);

                return createResponse(
                                reply,
                                "ATTENDANCE_TODAY",
                                "ATTENDANCE",
                                null,
                                item,
                                null);
        }

        // =========================================================
        // ATTENDANCE REPLY
        // =========================================================

        private String buildAttendanceReply(
                        Attendance att,
                        String message) {

                String status = att.getStatus() != null
                                ? att.getStatus().name()
                                : "UNKNOWN";

                LocalTime checkIn = att.getCheckIn();

                LocalTime checkOut = att.getCheckOut();

                Double workHours = att.getWorkHours();

                Integer breakMinutes = att.getTotalBreakMinutes();

                boolean onBreak = hasOpenBreak(att);

                // -----------------------------------------------------
                // CHECK-IN TIME
                // -----------------------------------------------------

                if (containsAny(
                                message,
                                "check in",
                                "check-in",
                                "checkin",
                                "what time did i check")) {

                        if (checkIn == null) {

                                return "You haven't checked in today yet. ⏰";
                        }

                        return "Your check-in time today was **" +
                                        formatTime(checkIn) +
                                        "**.";
                }

                // -----------------------------------------------------
                // CHECK-OUT TIME
                // -----------------------------------------------------

                if (containsAny(
                                message,
                                "check out",
                                "check-out",
                                "checkout",
                                "what time did i check out")) {

                        if (checkOut == null) {

                                return "You haven't checked out today yet.";
                        }

                        return "Your check-out time today was **" +
                                        formatTime(checkOut) +
                                        "**.";
                }

                // -----------------------------------------------------
                // WORK HOURS
                // -----------------------------------------------------

                if (containsAny(
                                message,
                                "work hours",
                                "working hours",
                                "hours worked",
                                "how many hours",
                                "worked today")) {

                        if (workHours == null) {

                                return "Your work hours haven't been calculated yet. " +
                                                "They will be available after checkout.";
                        }

                        return "You have worked **" +
                                        formatHours(workHours) +
                                        " hour(s)** today.";
                }

                // -----------------------------------------------------
                // BREAK
                // -----------------------------------------------------

                if (containsAny(
                                message,
                                "break",
                                "on break",
                                "break time")) {

                        if (onBreak) {

                                return "You are currently **on break**. ☕\n\n" +
                                                "Total recorded break time: " +
                                                formatBreakMinutes(breakMinutes) +
                                                " minutes.";
                        }

                        return "You are **not currently on break**.\n\n" +
                                        "Total recorded break time today: " +
                                        formatBreakMinutes(breakMinutes) +
                                        " minutes.";
                }

                // -----------------------------------------------------
                // GENERAL ATTENDANCE
                // -----------------------------------------------------

                StringBuilder reply = new StringBuilder();

                reply.append(
                                "Here is your attendance for today (");

                reply.append(att.getDate());

                reply.append("): 👇\n\n");

                reply.append("Status: **")
                                .append(formatStatus(status))
                                .append("**\n");

                reply.append("Check-in: **")
                                .append(formatTime(checkIn))
                                .append("**\n");

                reply.append("Check-out: **")
                                .append(formatTime(checkOut))
                                .append("**\n");

                reply.append("Work hours: **")
                                .append(
                                                workHours != null
                                                                ? formatHours(workHours)
                                                                : "--")
                                .append("**\n");

                reply.append("Break: **")
                                .append(
                                                formatBreakMinutes(
                                                                breakMinutes))
                                .append(" minutes**");

                if (onBreak) {

                        reply.append(
                                        "\n\n☕ You are currently on break.");
                }

                return reply.toString();
        }

        // =========================================================
        // OPEN BREAK
        // =========================================================

        private boolean hasOpenBreak(
                        Attendance attendance) {

                if (attendance.getBreaks() == null) {

                        return false;
                }

                return attendance.getBreaks()
                                .stream()
                                .anyMatch(
                                                breakRecord -> breakRecord.getBreakEnd() == null);
        }

        // =========================================================
        // LEAVE MANAGEMENT / HISTORY
        // =========================================================

        private ChatbotDTOs.MessageResponse getLeaveManagementResponse(
                        Employee employee,
                        String message) {

                /*
                 * ============================================================
                 * ADMIN / HR SHARED LEAVE QUEUE
                 * ============================================================
                 *
                 * Admin and HR must see pending requests from ALL employees.
                 * Do not use getEmployeeLeaveHistory() for this question.
                 */
                if (isHrOrAdmin(employee) && isPendingLeaveQuestion(message)) {

                        List<LeaveDTOs.Response> pendingLeaves = leaveService.getPendingLeaves(
                                        PageRequest.of(
                                                        0,
                                                        100,
                                                        Sort.by(
                                                                        Sort.Direction.DESC,
                                                                        "appliedAt")))
                                        .getContent();

                        return buildLeaveManagementResponse(
                                        pendingLeaves,
                                        "PENDING",
                                        "Here are the pending leave requests awaiting Admin/HR action: 👇",
                                        "LEAVE_PENDING");
                }

                /*
                 * ============================================================
                 * ADMIN / HR SHARED CANCELLATION QUEUE
                 * ============================================================
                 */
                if (isHrOrAdmin(employee) && isCancellationPendingQuestion(message)) {

                        List<LeaveDTOs.Response> pendingCancellations = leaveService.getPendingCancellations(
                                        PageRequest.of(
                                                        0,
                                                        100,
                                                        Sort.by(
                                                                        Sort.Direction.DESC,
                                                                        "appliedAt")))
                                        .getContent();

                        return buildLeaveManagementResponse(
                                        pendingCancellations,
                                        "CANCELLATION_PENDING",
                                        "Here are the leave cancellation requests awaiting Admin/HR action: 👇",
                                        "LEAVE_CANCELLATION_PENDING");
                }

                /*
                 * ============================================================
                 * EMPLOYEE OWN LEAVE HISTORY
                 * ============================================================
                 */
                List<LeaveDTOs.Response> leaves = getEmployeeLeaveHistory(employee);

                if (isPendingLeaveQuestion(message)) {
                        return buildLeaveManagementResponse(
                                        leaves,
                                        "PENDING",
                                        "Here are your pending leave requests: 👇",
                                        "LEAVE_PENDING");
                }

                if (isApprovedLeaveQuestion(message)) {
                        return buildLeaveManagementResponse(
                                        leaves,
                                        "APPROVED",
                                        "Here are your approved leave requests: 👇",
                                        "LEAVE_APPROVED");
                }

                if (isRejectedLeaveQuestion(message)) {
                        return buildLeaveManagementResponse(
                                        leaves,
                                        "REJECTED",
                                        "Here are your rejected leave requests: 👇",
                                        "LEAVE_REJECTED");
                }

                if (isCancelledLeaveQuestion(message)) {
                        return buildLeaveManagementResponse(
                                        leaves,
                                        "CANCELLED",
                                        "Here are your cancelled leave requests: 👇",
                                        "LEAVE_CANCELLED");
                }

                if (isCancellationPendingQuestion(message)) {
                        return buildLeaveManagementResponse(
                                        leaves,
                                        "CANCELLATION_PENDING",
                                        "Here are your leave cancellation requests awaiting review: 👇",
                                        "LEAVE_CANCELLATION_PENDING");
                }

                if (isUpcomingLeaveQuestion(message)) {
                        return buildUpcomingLeaveResponse(
                                        leaves,
                                        "LEAVE_UPCOMING");
                }

                if (isThisYearLeaveQuestion(message)) {
                        return buildThisYearLeaveResponse(
                                        leaves,
                                        "LEAVE_THIS_YEAR");
                }

                return buildLeaveManagementResponse(
                                leaves,
                                null,
                                "Here is your leave request history: 👇",
                                "LEAVE_HISTORY");
        }

        private List<LeaveDTOs.Response> getEmployeeLeaveHistory(
                        Employee employee) {

                return leaveService.getMyLeaves(
                                employee.getId(),
                                PageRequest.of(
                                                0,
                                                100,
                                                Sort.by(Sort.Direction.DESC, "appliedAt")))
                                .getContent();
        }

        private boolean isLeaveManagementQuestion(String message) {

                if (message == null || message.isBlank()) {
                        return false;
                }

                return isPendingLeaveQuestion(message)
                                || isApprovedLeaveQuestion(message)
                                || isRejectedLeaveQuestion(message)
                                || isCancelledLeaveQuestion(message)
                                || isCancellationPendingQuestion(message)
                                || isUpcomingLeaveQuestion(message)
                                || isThisYearLeaveQuestion(message)
                                || containsAny(
                                                message,
                                                "leave history",
                                                "leave request history",
                                                "leave requests",
                                                "my leave requests",
                                                "my leaves",
                                                "leave status",
                                                "status of my leave",
                                                "status of my leaves",
                                                "show my leaves",
                                                "show my leave",
                                                "leave records",
                                                "leave record",
                                                "past leaves",
                                                "past leave");
        }

        private boolean isPendingLeaveQuestion(String message) {
                return containsAny(
                                message,
                                "pending leave",
                                "pending leaves",
                                "pending leave request",
                                "pending leave requests",
                                "leave pending",
                                "leaves pending",
                                "pending request",
                                "pending requests");
        }

        private boolean isApprovedLeaveQuestion(String message) {
                return containsAny(
                                message,
                                "approved leave",
                                "approved leaves",
                                "approved leave request",
                                "approved leave requests",
                                "leave approved",
                                "leaves approved");
        }

        private boolean isRejectedLeaveQuestion(String message) {
                return containsAny(
                                message,
                                "rejected leave",
                                "rejected leaves",
                                "rejected leave request",
                                "rejected leave requests",
                                "leave rejected",
                                "leaves rejected",
                                "denied leave",
                                "denied leaves");
        }

        private boolean isCancelledLeaveQuestion(String message) {
                return containsAny(
                                message,
                                "cancelled leave",
                                "cancelled leaves",
                                "cancelled leave request",
                                "cancelled leave requests",
                                "canceled leave",
                                "canceled leaves",
                                "leave cancelled",
                                "leave canceled");
        }

        private boolean isCancellationPendingQuestion(String message) {
                return containsAny(
                                message,
                                "cancellation pending",
                                "pending cancellation",
                                "pending leave cancellation",
                                "leave cancellation pending",
                                "cancellation request",
                                "cancellation requests");
        }

        private boolean isUpcomingLeaveQuestion(String message) {
                return containsAny(
                                message,
                                "upcoming leave",
                                "upcoming leaves",
                                "upcoming leave request",
                                "upcoming leave requests",
                                "future leave",
                                "future leaves",
                                "next leave",
                                "next leaves",
                                "leave coming up",
                                "leaves coming up");
        }

        private boolean isThisYearLeaveQuestion(String message) {
                return containsAny(
                                message,
                                "leave this year",
                                "leaves this year",
                                "leave requests this year",
                                "leave history this year",
                                "leaves in " + LocalDate.now(IST_ZONE).getYear(),
                                "leave in " + LocalDate.now(IST_ZONE).getYear());
        }

        private ChatbotDTOs.MessageResponse buildLeaveManagementResponse(
                        List<LeaveDTOs.Response> leaves,
                        String statusFilter,
                        String heading,
                        String intent) {

                List<ChatbotDTOs.LeaveHistoryItem> items = leaves.stream()
                                .filter(leave -> statusFilter == null
                                                || (leave.getStatus() != null
                                                                && statusFilter.equalsIgnoreCase(
                                                                                leave.getStatus().name())))
                                .map(this::toLeaveHistoryItem)
                                .collect(Collectors.toList());

                if (items.isEmpty()) {
                        String noDataMessage = switch (statusFilter == null
                                        ? "ALL"
                                        : statusFilter) {
                                case "PENDING" ->
                                        "You currently have no pending leave requests. ✅";
                                case "APPROVED" ->
                                        "You currently have no approved leave requests.";
                                case "REJECTED" ->
                                        "You currently have no rejected leave requests.";
                                case "CANCELLED" ->
                                        "You currently have no cancelled leave requests.";
                                case "CANCELLATION_PENDING" ->
                                        "You currently have no pending cancellation requests.";
                                default ->
                                        "You don't have any leave requests in your history yet.";
                        };

                        return createLeaveHistoryResponse(
                                        noDataMessage,
                                        intent,
                                        items);
                }

                StringBuilder reply = new StringBuilder(heading)
                                .append("\n\n");

                for (int i = 0; i < items.size(); i++) {
                        appendLeaveHistoryItem(reply, items.get(i), i + 1);
                }

                return createLeaveHistoryResponse(
                                reply.toString().trim(),
                                intent,
                                items);
        }

        private ChatbotDTOs.MessageResponse buildUpcomingLeaveResponse(
                        List<LeaveDTOs.Response> leaves,
                        String intent) {

                LocalDate today = LocalDate.now(IST_ZONE);

                List<LeaveDTOs.Response> upcoming = leaves.stream()
                                .filter(leave -> leave.getStartDate() != null)
                                .filter(leave -> !leave.getStartDate().isBefore(today))
                                .filter(leave -> leave.getStatus() == LeaveStatus.APPROVED
                                                || leave.getStatus() == LeaveStatus.PENDING)
                                .sorted((a, b) -> a.getStartDate().compareTo(b.getStartDate()))
                                .collect(Collectors.toList());

                List<ChatbotDTOs.LeaveHistoryItem> items = upcoming.stream()
                                .map(this::toLeaveHistoryItem)
                                .collect(Collectors.toList());

                if (items.isEmpty()) {
                        return createLeaveHistoryResponse(
                                        "You don't have any upcoming approved or pending leave requests. 📅",
                                        intent,
                                        items);
                }

                StringBuilder reply = new StringBuilder(
                                "Here are your upcoming leave requests: 👇\n\n");

                for (int i = 0; i < items.size(); i++) {
                        appendLeaveHistoryItem(reply, items.get(i), i + 1);
                }

                return createLeaveHistoryResponse(
                                reply.toString().trim(),
                                intent,
                                items);
        }

        private ChatbotDTOs.MessageResponse buildThisYearLeaveResponse(
                        List<LeaveDTOs.Response> leaves,
                        String intent) {

                int currentYear = LocalDate.now(IST_ZONE).getYear();

                List<LeaveDTOs.Response> thisYear = leaves.stream()
                                .filter(leave -> leave.getStartDate() != null)
                                .filter(leave -> leave.getStartDate().getYear() == currentYear)
                                .sorted((a, b) -> {
                                        LocalDate da = a.getStartDate();
                                        LocalDate db = b.getStartDate();
                                        return db.compareTo(da);
                                })
                                .collect(Collectors.toList());

                List<ChatbotDTOs.LeaveHistoryItem> items = thisYear.stream()
                                .map(this::toLeaveHistoryItem)
                                .collect(Collectors.toList());

                if (items.isEmpty()) {
                        return createLeaveHistoryResponse(
                                        "You don't have any leave requests recorded for "
                                                        + currentYear + ".",
                                        intent,
                                        items);
                }

                StringBuilder reply = new StringBuilder(
                                "Here are your leave requests for "
                                                + currentYear + ": 👇\n\n");

                for (int i = 0; i < items.size(); i++) {
                        appendLeaveHistoryItem(reply, items.get(i), i + 1);
                }

                return createLeaveHistoryResponse(
                                reply.toString().trim(),
                                intent,
                                items);
        }

        private ChatbotDTOs.LeaveHistoryItem toLeaveHistoryItem(
                        LeaveDTOs.Response leave) {

                String status = leave.getStatus() != null
                                ? leave.getStatus().name()
                                : "UNKNOWN";

                return new ChatbotDTOs.LeaveHistoryItem(
                                leave.getId(),
                                leave.getLeaveType(),
                                leave.getStartDate(),
                                leave.getEndDate(),
                                leave.getTotalDays(),
                                leave.getReason(),
                                status,
                                leave.getReviewedByName(),
                                leave.getRemarks(),
                                leave.getAppliedAt(),
                                leave.getActionAt(),
                                leave.getCancellationReason(),
                                leave.getCancellationRequestedAt(),
                                leave.getCancellationRemarks(),
                                leave.getCancellationActionAt(),
                                leave.getCancellationReviewedByName());
        }

        private void appendLeaveHistoryItem(
                        StringBuilder reply,
                        ChatbotDTOs.LeaveHistoryItem item,
                        int number) {

                reply.append(number)
                                .append(". ")
                                .append(formatLeaveType(item.getLeaveType()))
                                .append(" — **")
                                .append(formatLeaveStatus(item.getStatus()))
                                .append("**\n");

                reply.append("   📅 ")
                                .append(formatDate(item.getStartDate()))
                                .append(" → ")
                                .append(formatDate(item.getEndDate()))
                                .append("\n");

                reply.append("   ⏱️ ")
                                .append(item.getTotalDays())
                                .append(" day(s)\n");

                if (item.getReason() != null
                                && !item.getReason().isBlank()) {
                        reply.append("   📝 Reason: ")
                                        .append(item.getReason())
                                        .append("\n");
                }

                if (item.getReviewedByName() != null
                                && !item.getReviewedByName().isBlank()) {
                        reply.append("   👤 Reviewed by: ")
                                        .append(item.getReviewedByName())
                                        .append("\n");
                }

                if (item.getRemarks() != null
                                && !item.getRemarks().isBlank()) {
                        reply.append("   💬 Remarks: ")
                                        .append(item.getRemarks())
                                        .append("\n");
                }

                if (item.getCancellationReason() != null
                                && !item.getCancellationReason().isBlank()) {
                        reply.append("   ↩️ Cancellation reason: ")
                                        .append(item.getCancellationReason())
                                        .append("\n");
                }

                reply.append("   🕒 Applied: ")
                                .append(formatDateTime(item.getAppliedAt()))
                                .append("\n\n");
        }

        private ChatbotDTOs.MessageResponse createLeaveHistoryResponse(
                        String reply,
                        String intent,
                        List<ChatbotDTOs.LeaveHistoryItem> items) {

                return new ChatbotDTOs.MessageResponse(
                                reply,
                                intent,
                                "LEAVE_HISTORY",
                                null,
                                null,
                                null,
                                items,
                                LocalDateTime.now());
        }

        private String formatLeaveStatus(String status) {
                if (status == null || status.isBlank()) {
                        return "Unknown";
                }

                return switch (status.toUpperCase(Locale.ROOT)) {
                        case "PENDING" -> "Pending";
                        case "APPROVED" -> "Approved";
                        case "REJECTED" -> "Rejected";
                        case "CANCELLED" -> "Cancelled";
                        case "CANCELLATION_PENDING" -> "Cancellation Pending";
                        default -> status;
                };
        }

        private String formatDate(LocalDate date) {
                return date != null ? date.toString() : "--";
        }

        private String formatDateTime(LocalDateTime dateTime) {
                if (dateTime == null) {
                        return "--";
                }

                return dateTime.toLocalDate()
                                + " "
                                + dateTime.toLocalTime()
                                                .withNano(0)
                                                .toString();
        }

        // =========================================================
        // LEAVE BALANCE
        // =========================================================

        private ChatbotDTOs.MessageResponse getLeaveBalanceResponse(
                        Employee employee,
                        String message) {

                List<LeaveDTOs.BalanceResponse> balances = leaveBalanceService.getAllBalances(employee);

                List<ChatbotDTOs.LeaveBalanceItem> items = new ArrayList<>();

                for (LeaveDTOs.BalanceResponse balance : balances) {

                        String leaveType = balance.getLeaveType();

                        double total = toDouble(balance.getTotalAllotted());

                        double used = toDouble(balance.getUsed());

                        double remaining = toDouble(balance.getRemaining());

                        Object displayedRemaining;

                        String status;

                        if ("UNPAID".equalsIgnoreCase(leaveType)) {

                                displayedRemaining = "Unlimited";

                                status = "UNLIMITED";

                        } else {

                                displayedRemaining = remaining;

                                status = remaining > 0
                                                ? "AVAILABLE"
                                                : "EXHAUSTED";
                        }

                        items.add(
                                        new ChatbotDTOs.LeaveBalanceItem(
                                                        leaveType,
                                                        balance.getYear(),
                                                        total,
                                                        used,
                                                        displayedRemaining,
                                                        status));
                }

                String requestedLeaveType = detectLeaveType(message);

                if (requestedLeaveType != null) {

                        for (ChatbotDTOs.LeaveBalanceItem item : items) {

                                if (item.getLeaveType()
                                                .equalsIgnoreCase(
                                                                requestedLeaveType)) {

                                        return createResponse(
                                                        buildSingleLeaveReply(item),
                                                        "LEAVE_BALANCE",
                                                        "LEAVE_BALANCE",
                                                        List.of(item),
                                                        null,
                                                        null);
                                }
                        }
                }

                return createResponse(
                                buildAllLeaveReply(
                                                employee,
                                                items),
                                "LEAVE_BALANCE",
                                "LEAVE_BALANCE",
                                items,
                                null,
                                null);
        }

        // =========================================================
        // SINGLE LEAVE
        // =========================================================

        private String buildSingleLeaveReply(
                        ChatbotDTOs.LeaveBalanceItem item) {

                String leaveName = formatLeaveType(
                                item.getLeaveType());

                if ("Unlimited".equals(
                                item.getRemaining())) {

                        return "Your " +
                                        leaveName +
                                        " leave is unlimited. ♾️";
                }

                return "You currently have **" +
                                formatNumber(
                                                item.getRemaining())
                                +
                                " " +
                                leaveName +
                                " leave day(s) remaining.**\n\n" +

                                "Total allocated: " +
                                formatNumber(
                                                item.getTotal())
                                +

                                "\nUsed: " +
                                formatNumber(
                                                item.getUsed())
                                +

                                "\nRemaining: " +
                                formatNumber(
                                                item.getRemaining());
        }

        // =========================================================
        // ALL LEAVES
        // =========================================================

        private String buildAllLeaveReply(
                        Employee employee,
                        List<ChatbotDTOs.LeaveBalanceItem> items) {

                String firstName = employee.getFirstName();

                if (firstName == null ||
                                firstName.isBlank()) {

                        firstName = "you";
                }

                StringBuilder reply = new StringBuilder();

                reply.append(
                                "Here is your current leave balance, ")
                                .append(firstName)
                                .append(": 👇\n\n");

                for (ChatbotDTOs.LeaveBalanceItem item : items) {

                        reply.append("• ")
                                        .append(
                                                        formatLeaveType(
                                                                        item.getLeaveType()))
                                        .append(": ");

                        if ("Unlimited".equals(
                                        item.getRemaining())) {

                                reply.append("Unlimited");

                        } else {

                                reply.append(
                                                formatNumber(
                                                                item.getRemaining()))
                                                .append(
                                                                " day(s) remaining");
                        }

                        reply.append("\n");
                }

                return reply.toString();
        }

        // =========================================================
        // LEAVE TYPE
        // =========================================================

        private String detectLeaveType(
                        String message) {

                if (containsAny(
                                message,
                                "annual",
                                "annual leave")) {

                        return "ANNUAL";
                }

                if (containsAny(
                                message,
                                "sick",
                                "sick leave")) {

                        return "SICK";
                }

                if (containsAny(
                                message,
                                "casual",
                                "casual leave")) {

                        return "CASUAL";
                }

                if (containsAny(
                                message,
                                "paternity",
                                "paternity leave")) {

                        return "PATERNITY";
                }

                if (containsAny(
                                message,
                                "maternity",
                                "maternity leave")) {

                        return "MATERNITY";
                }

                if (containsAny(
                                message,
                                "unpaid",
                                "unpaid leave",
                                "lop",
                                "loss of pay")) {

                        return "UNPAID";
                }

                return null;
        }

        // =========================================================
        // LEAVE QUESTION
        // =========================================================

        private boolean isLeaveBalanceQuestion(
                        String message) {

                boolean leaveKeyword = containsAny(
                                message,
                                "leave",
                                "leaves",
                                "vacation",
                                "holiday",
                                "time off",
                                "days off");

                boolean balanceKeyword = containsAny(
                                message,
                                "balance",
                                "remaining",
                                "remain",
                                "left",
                                "available",
                                "how many",
                                "how much");

                boolean balancePhrase = containsAny(
                                message,
                                "leave balance",
                                "leave remaining",
                                "leave left",
                                "leave available",
                                "days remaining",
                                "days left",
                                "days available");

                return balancePhrase || (leaveKeyword && balanceKeyword);
        }

        // =========================================================
        // ATTENDANCE ANALYTICS QUESTION
        // =========================================================

        private boolean isAttendanceAnalyticsQuestion(
                        String message) {

                return isYesterdayQuestion(message)
                                || isWeeklyAttendanceQuestion(message)
                                || isMonthlyAttendanceQuestion(message)
                                || isAttendancePercentageQuestion(message)
                                || isPresentDaysQuestion(message)
                                || isAbsentDaysQuestion(message)
                                || isHalfDayQuestion(message)
                                || isTotalHoursQuestion(message)
                                || isAverageHoursQuestion(message);
        }

        // =========================================================
        // YESTERDAY QUESTION
        // =========================================================

        private boolean isYesterdayQuestion(
                        String message) {

                return containsAny(
                                message,
                                "yesterday",
                                "yesterday attendance",
                                "attendance yesterday");
        }

        // =========================================================
        // WEEKLY QUESTION
        // =========================================================

        private boolean isWeeklyAttendanceQuestion(
                        String message) {

                return containsAny(
                                message,
                                "this week",
                                "weekly attendance",
                                "weekly",
                                "week attendance",
                                "attendance this week");
        }

        // =========================================================
        // MONTHLY QUESTION
        // =========================================================

        private boolean isMonthlyAttendanceQuestion(
                        String message) {

                return containsAny(
                                message,
                                "this month",
                                "monthly attendance",
                                "monthly",
                                "month attendance",
                                "attendance this month");
        }

        // =========================================================
        // ATTENDANCE PERCENTAGE
        // =========================================================

        private boolean isAttendancePercentageQuestion(
                        String message) {

                return containsAny(
                                message,
                                "attendance percentage",
                                "attendance percent",
                                "attendance %",
                                "percentage attendance",
                                "percent attendance");
        }

        // =========================================================
        // PRESENT DAYS
        // =========================================================

        private boolean isPresentDaysQuestion(
                        String message) {

                return containsAny(
                                message,
                                "how many days was i present",
                                "how many days am i present",
                                "present days",
                                "number of present days",
                                "days present");
        }

        // =========================================================
        // ABSENT DAYS
        // =========================================================

        private boolean isAbsentDaysQuestion(
                        String message) {

                return containsAny(
                                message,
                                "how many days was i absent",
                                "how many days am i absent",
                                "absent days",
                                "number of absent days",
                                "days absent");
        }

        // =========================================================
        // HALF DAYS
        // =========================================================

        private boolean isHalfDayQuestion(
                        String message) {

                return containsAny(
                                message,
                                "half day",
                                "half days",
                                "how many half days",
                                "number of half days");
        }

        // =========================================================
        // TOTAL HOURS
        // =========================================================

        private boolean isTotalHoursQuestion(
                        String message) {

                return containsAny(
                                message,
                                "total work hours",
                                "total working hours",
                                "total hours",
                                "hours this week",
                                "hours this month",
                                "worked this week",
                                "worked this month",
                                "how many hours did i work",
                                "how many hours have i worked");
        }

        // =========================================================
        // AVERAGE HOURS
        // =========================================================

        private boolean isAverageHoursQuestion(
                        String message) {

                return containsAny(
                                message,
                                "average work hours",
                                "average working hours",
                                "average hours",
                                "average working time",
                                "avg hours");
        }

        // =========================================================
        // TODAY ATTENDANCE QUESTION
        // =========================================================

        private boolean isAttendanceQuestion(
                        String message) {

                return containsAny(
                                message,
                                "attendance today",
                                "today attendance",
                                "present today",
                                "absent today",
                                "check in",
                                "check-in",
                                "checkin",
                                "check out",
                                "check-out",
                                "checkout",
                                "work hours",
                                "working hours",
                                "hours worked",
                                "worked today",
                                "on break",
                                "break");
        }

        // =========================================================
        // GREETING
        // =========================================================

        private boolean isGreeting(String message) {

                if (message == null ||
                                message.isBlank()) {

                        return false;
                }

                String normalized = message
                                .trim()
                                .toLowerCase(Locale.ROOT)
                                .replaceAll("[^a-z0-9\\s]", " ")
                                .replaceAll("\\s+", " ")
                                .trim();

                // Exact greetings
                if (normalized.equals("hi")
                                || normalized.equals("hello")
                                || normalized.equals("hey")
                                || normalized.equals("good morning")
                                || normalized.equals("good afternoon")
                                || normalized.equals("good evening")) {

                        return true;
                }

                // Greetings followed by a name or additional text
                return normalized.startsWith("hi ")
                                || normalized.startsWith("hello ")
                                || normalized.startsWith("hey ");
        }

        // =========================================================
        // STRING CHECK
        // =========================================================

        private boolean containsAny(
                        String message,
                        String... values) {

                if (message == null) {
                        return false;
                }

                for (String value : values) {

                        if (message.contains(value)) {

                                return true;
                        }
                }

                return false;
        }

        // =========================================================
        // RESPONSE BUILDER
        // =========================================================

        private ChatbotDTOs.MessageResponse createResponse(
                        String reply,
                        String intent,
                        String type,
                        List<ChatbotDTOs.LeaveBalanceItem> balances,
                        ChatbotDTOs.AttendanceItem attendance,
                        ChatbotDTOs.AttendanceAnalyticsItem analytics) {

                return new ChatbotDTOs.MessageResponse(
                                reply,
                                intent,
                                type,
                                balances,
                                attendance,
                                analytics,
                                LocalDateTime.now());
        }

        // =========================================================
        // TOTAL WORK HOURS
        // =========================================================

        private double calculateTotalWorkHours(
                        List<AttendanceDTOs.DailyRecord> records) {

                if (records == null ||
                                records.isEmpty()) {

                        return 0.0;
                }

                double total = 0.0;

                for (AttendanceDTOs.DailyRecord record : records) {

                        if (record.getWorkHours() != null) {

                                total += record.getWorkHours();
                        }
                }

                return total;
        }

        // =========================================================
        // FORMAT TIME
        // =========================================================

        private String formatTime(
                        LocalTime time) {

                if (time == null) {

                        return "--";
                }

                String value = time.toString();

                return value.substring(
                                0,
                                Math.min(
                                                5,
                                                value.length()));
        }

        // =========================================================
        // FORMAT HOURS
        // =========================================================

        private String formatHours(
                        Double hours) {

                if (hours == null) {

                        return "0.00";
                }

                return String.format(
                                Locale.ROOT,
                                "%.2f",
                                hours);
        }

        // =========================================================
        // FORMAT BREAK
        // =========================================================

        private String formatBreakMinutes(
                        Integer minutes) {

                if (minutes == null) {

                        return "0";
                }

                return String.valueOf(minutes);
        }

        // =========================================================
        // FORMAT STATUS
        // =========================================================

        private String formatStatus(
                        String status) {

                if (status == null) {

                        return "Unknown";
                }

                return switch (status.toUpperCase(Locale.ROOT)) {

                        case "PRESENT" ->
                                "Present";

                        case "ABSENT" ->
                                "Absent";

                        case "HALF_DAY" ->
                                "Half Day";

                        case "ON_LEAVE" ->
                                "On Leave";

                        case "WEEKEND" ->
                                "Weekend";

                        default ->
                                status;
                };
        }

        // =========================================================
        // FORMAT LEAVE TYPE
        // =========================================================

        private String formatLeaveType(
                        String leaveType) {

                if (leaveType == null) {

                        return "Leave";
                }

                return switch (leaveType.toUpperCase(Locale.ROOT)) {

                        case "ANNUAL" ->
                                "Annual";

                        case "SICK" ->
                                "Sick";

                        case "CASUAL" ->
                                "Casual";

                        case "PATERNITY" ->
                                "Paternity";

                        case "MATERNITY" ->
                                "Maternity";

                        case "UNPAID" ->
                                "Unpaid";

                        default ->
                                leaveType;
                };
        }

        // =========================================================
        // NUMBER CONVERSION
        // =========================================================

        private double toDouble(
                        Object value) {

                if (value == null) {

                        return 0;
                }

                if (value instanceof Number number) {

                        return number.doubleValue();
                }

                try {

                        return Double.parseDouble(
                                        value.toString());

                } catch (Exception ignored) {

                        return 0;
                }
        }

        // =========================================================
        // NUMBER FORMAT
        // =========================================================

        private String formatNumber(
                        Object value) {

                double number = toDouble(value);

                if (number == Math.floor(number)) {

                        return String.valueOf(
                                        (int) number);
                }

                return String.format(
                                Locale.ROOT,
                                "%.2f",
                                number);
        }

        // =========================================================
        // PERCENTAGE
        // =========================================================

        private String formatPercentage(
                        Double percentage) {

                if (percentage == null) {

                        return "0.00";
                }

                return String.format(
                                Locale.ROOT,
                                "%.2f",
                                percentage);
        }

        // =========================================================
        // SAFE INTEGER
        // =========================================================

        private int safeInt(
                        Integer value) {

                return value != null
                                ? value
                                : 0;
        }

        // =========================================================
        // ROUND TWO
        // =========================================================

        private double roundTwo(
                        double value) {

                return Math.round(
                                value * 100.0) / 100.0;
        }
}