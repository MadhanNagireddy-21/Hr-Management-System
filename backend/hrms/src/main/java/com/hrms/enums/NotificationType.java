public enum NotificationType {
    // Leave
    LEAVE_APPLIED,
    LEAVE_APPROVED,
    LEAVE_REJECTED,
    LEAVE_CANCELLED,

    // Attendance
    ATTENDANCE_REMINDER,

    // Payroll
    PAYROLL_GENERATED,

    // Performance
    PERFORMANCE_REVIEWED,    // ← NEW

    // Training
    TRAINING_ENROLLED,       // ← NEW
    TRAINING_COMPLETED,      // ← NEW

    // Onboarding
    ONBOARDING_INITIATED,    // ← NEW

    // Recruitment
    JOB_APPLICATION,         // ← NEW

    // General
    GENERAL
}