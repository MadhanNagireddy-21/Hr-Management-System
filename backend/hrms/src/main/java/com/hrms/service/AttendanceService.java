package com.hrms.service;

import com.hrms.dto.AttendanceDTOs;
import com.hrms.entity.Attendance;
import com.hrms.entity.Employee;
import com.hrms.enums.AttendanceStatus;
import com.hrms.repository.AttendanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepo;
    private final EmployeeService employeeService;

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardData", allEntries = true)
    public AttendanceDTOs.Response checkIn(Long employeeId, AttendanceDTOs.CheckInRequest req) {
        Employee emp = employeeService.findById(employeeId);
        java.time.ZoneId istZone = java.time.ZoneId.of("Asia/Kolkata");
        LocalDate date = (req != null && req.getDate() != null) ? req.getDate() : LocalDate.now(istZone);

        if (attendanceRepo.findByEmployeeAndDate(emp, date).isPresent()) {
            throw new IllegalStateException("Already checked in for " + date);
        }

        LocalTime checkIn = (req != null && req.getCheckIn() != null) ? req.getCheckIn()
                : LocalTime.now(istZone).withNano(0);

        Attendance att = Attendance.builder()
                .employee(emp)
                .date(date)
                .checkIn(checkIn)
                .status(AttendanceStatus.PRESENT)
                .build();

        return toResponse(attendanceRepo.save(att));
    }

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardData", allEntries = true)
    public AttendanceDTOs.Response checkOut(Long employeeId, AttendanceDTOs.CheckOutRequest req) {
        Employee emp = employeeService.findById(employeeId);
        java.time.ZoneId istZone = java.time.ZoneId.of("Asia/Kolkata");
        LocalDate today = LocalDate.now(istZone);

        Attendance att = attendanceRepo.findByEmployeeAndDate(emp, today)
                .or(() -> attendanceRepo.findFirstByEmployeeAndCheckOutIsNullOrderByDateDesc(emp))
                .orElseThrow(() -> new com.hrms.exception.AttendanceRecordNotFound());

        LocalTime checkOut = (req != null && req.getCheckOut() != null) ? req.getCheckOut()
                : LocalTime.now(istZone).withNano(0);
        att.setCheckOut(checkOut);

        double hours = att.getCheckIn().until(checkOut, ChronoUnit.MINUTES) / 60.0;
        if (hours < 0) {
            hours += 24.0;
        }
        att.setWorkHours(Math.round(hours * 100.0) / 100.0);

        if (hours < 4)
            att.setStatus(AttendanceStatus.HALF_DAY);
        else
            att.setStatus(AttendanceStatus.PRESENT);

        if (req != null && req.getRemarks() != null && !req.getRemarks().isBlank()) {
            att.setRemarks(req.getRemarks());
        }

        return toResponse(attendanceRepo.save(att));
    }

    @Transactional(readOnly = true)
    public Page<AttendanceDTOs.Response> getMyAttendance(Long employeeId, Pageable pageable) {
        Employee emp = employeeService.findById(employeeId);
        return attendanceRepo.findByEmployee(emp, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<AttendanceDTOs.Response> getAttendanceByDate(LocalDate date, Pageable pageable) {
        return attendanceRepo.findByDate(date, pageable).map(this::toResponse);
    }

    // NEW: Get employee detailed report with yesterday, weekly, and monthly
    @Transactional(readOnly = true)
    public AttendanceDTOs.EmployeeDetailedReport getEmployeeDetailedReport(Long employeeId, LocalDate asOfDate) {
        Employee emp = employeeService.findById(employeeId);

        // Get yesterday
        LocalDate yesterday = asOfDate.minusDays(1);
        Attendance yesterdayRecord = attendanceRepo.findByEmployeeAndDate(emp, yesterday).orElse(null);

        // Get weekly (7 days ending on asOfDate)
        LocalDate weekStart = asOfDate.minusDays(6);
        List<Attendance> weekRecords = attendanceRepo.findByEmployeeAndDateRangeOrderByDate(emp, weekStart, asOfDate);

        // Get monthly (entire month of asOfDate)
        YearMonth yearMonth = YearMonth.from(asOfDate);
        LocalDate monthStart = yearMonth.atDay(1);
        LocalDate monthEnd = yearMonth.atEndOfMonth();
        List<Attendance> monthRecords = attendanceRepo.findByEmployeeAndDateRangeOrderByDate(emp, monthStart, monthEnd);

        // Build weekly records with day names
        List<AttendanceDTOs.DailyRecord> weeklyRecords = buildWeeklyRecords(emp, weekStart, asOfDate, weekRecords);
        AttendanceDTOs.WeeklyStats weeklyStats = calculateWeeklyStats(weekRecords);

        // Build monthly records with day names
        List<AttendanceDTOs.DailyRecord> monthlyRecords = buildMonthlyRecords(emp, monthStart, monthEnd, monthRecords);
        AttendanceDTOs.MonthlyStats monthlyStats = calculateMonthlyStats(monthRecords, monthStart, monthEnd);

        return new AttendanceDTOs.EmployeeDetailedReport(
                emp.getId(),
                emp.getEmployeeId(), // FIXED: was getEmployeeCode()
                emp.getFirstName() + " " + emp.getLastName(),
                emp.getDepartment() != null ? emp.getDepartment() : "N/A", // FIXED: was getDepartment().getName()
                yesterday,
                yesterdayRecord != null ? yesterdayRecord.getStatus().name() : "ABSENT",
                yesterdayRecord != null ? yesterdayRecord.getCheckIn() : null,
                yesterdayRecord != null ? yesterdayRecord.getCheckOut() : null,
                yesterdayRecord != null ? yesterdayRecord.getWorkHours() : 0.0,
                yesterdayRecord != null ? yesterdayRecord.getRemarks() : null,
                weeklyRecords,
                weeklyStats,
                monthlyRecords,
                monthlyStats);
    }

    // NEW: Get employee summary for a specific date (for admin dashboard)
    @Transactional(readOnly = true)
    public AttendanceDTOs.EmployeeAttendanceSummary getEmployeeAttendanceSummary(Long employeeId, LocalDate date) {
        Employee emp = employeeService.findById(employeeId);
        Attendance att = attendanceRepo.findByEmployeeAndDate(emp, date).orElse(null);

        AttendanceDTOs.EmployeeAttendanceSummary summary = new AttendanceDTOs.EmployeeAttendanceSummary();
        summary.setEmployeeId(emp.getId());
        summary.setEmployeeCode(emp.getEmployeeId()); // FIXED: was getEmployeeCode()
        summary.setEmployeeName(emp.getFirstName() + " " + emp.getLastName());
        summary.setDepartmentName(emp.getDepartment() != null ? emp.getDepartment() : "N/A"); // FIXED: was
                                                                                              // getDepartment().getName()

        if (att != null) {
            summary.setStatus(att.getStatus().name());
            summary.setCheckIn(att.getCheckIn());
            summary.setCheckOut(att.getCheckOut());
            summary.setWorkHours(att.getWorkHours());
        } else {
            summary.setStatus("ABSENT");
            summary.setWorkHours(0.0);
        }

        return summary;
    }

    // NEW: Get all employees attendance summary for a date (for admin dashboard)
    @Transactional(readOnly = true)
    public Page<AttendanceDTOs.EmployeeAttendanceSummary> getAllEmployeesSummaryByDate(LocalDate date,
            Pageable pageable) {
        return attendanceRepo.findByDate(date, pageable)
                .map(att -> {
                    AttendanceDTOs.EmployeeAttendanceSummary summary = new AttendanceDTOs.EmployeeAttendanceSummary();
                    summary.setEmployeeId(att.getEmployee().getId());
                    summary.setEmployeeCode(att.getEmployee().getEmployeeId()); // FIXED: was getEmployeeCode()
                    summary.setEmployeeName(att.getEmployee().getFirstName() + " " + att.getEmployee().getLastName());
                    summary.setDepartmentName(
                            att.getEmployee().getDepartment() != null ? att.getEmployee().getDepartment() : "N/A"); // FIXED:
                                                                                                                    // was
                                                                                                                    // getDepartment().getName()
                    summary.setStatus(att.getStatus().name());
                    summary.setCheckIn(att.getCheckIn());
                    summary.setCheckOut(att.getCheckOut());
                    summary.setWorkHours(att.getWorkHours());
                    return summary;
                });
    }

    // Helper: Build weekly records with proper day names
    private List<AttendanceDTOs.DailyRecord> buildWeeklyRecords(Employee emp, LocalDate weekStart, LocalDate weekEnd,
            List<Attendance> records) {
        Map<LocalDate, Attendance> recordMap = records.stream()
                .collect(Collectors.toMap(Attendance::getDate, a -> a));

        List<AttendanceDTOs.DailyRecord> dailyRecords = new ArrayList<>();
        for (LocalDate date = weekStart; !date.isAfter(weekEnd); date = date.plusDays(1)) {
            String dayName = date.getDayOfWeek().toString().substring(0, 3); // Mon, Tue, etc

            if (isWeekend(date)) {
                AttendanceDTOs.DailyRecord day = new AttendanceDTOs.DailyRecord();
                day.setDate(date);
                day.setDayName(dayName);
                day.setStatus("WEEKEND");
                dailyRecords.add(day);
            } else if (recordMap.containsKey(date)) {
                Attendance att = recordMap.get(date);
                AttendanceDTOs.DailyRecord day = new AttendanceDTOs.DailyRecord();
                day.setDate(date);
                day.setDayName(dayName);
                day.setStatus(att.getStatus().name());
                day.setCheckIn(att.getCheckIn());
                day.setCheckOut(att.getCheckOut());
                day.setWorkHours(att.getWorkHours());
                day.setRemarks(att.getRemarks());
                dailyRecords.add(day);
            } else {
                AttendanceDTOs.DailyRecord day = new AttendanceDTOs.DailyRecord();
                day.setDate(date);
                day.setDayName(dayName);
                day.setStatus("ABSENT");
                dailyRecords.add(day);
            }
        }
        return dailyRecords;
    }

    // Helper: Build monthly records
    private List<AttendanceDTOs.DailyRecord> buildMonthlyRecords(Employee emp, LocalDate monthStart, LocalDate monthEnd,
            List<Attendance> records) {
        Map<LocalDate, Attendance> recordMap = records.stream()
                .collect(Collectors.toMap(Attendance::getDate, a -> a));

        List<AttendanceDTOs.DailyRecord> dailyRecords = new ArrayList<>();
        for (LocalDate date = monthStart; !date.isAfter(monthEnd); date = date.plusDays(1)) {
            String dayName = date.getDayOfWeek().toString().substring(0, 3);

            if (isWeekend(date)) {
                AttendanceDTOs.DailyRecord day = new AttendanceDTOs.DailyRecord();
                day.setDate(date);
                day.setDayName(dayName);
                day.setStatus("WEEKEND");
                dailyRecords.add(day);
            } else if (recordMap.containsKey(date)) {
                Attendance att = recordMap.get(date);
                AttendanceDTOs.DailyRecord day = new AttendanceDTOs.DailyRecord();
                day.setDate(date);
                day.setDayName(dayName);
                day.setStatus(att.getStatus().name());
                day.setCheckIn(att.getCheckIn());
                day.setCheckOut(att.getCheckOut());
                day.setWorkHours(att.getWorkHours());
                day.setRemarks(att.getRemarks());
                dailyRecords.add(day);
            } else {
                AttendanceDTOs.DailyRecord day = new AttendanceDTOs.DailyRecord();
                day.setDate(date);
                day.setDayName(dayName);
                day.setStatus("ABSENT");
                dailyRecords.add(day);
            }
        }
        return dailyRecords;
    }

    // Helper: Calculate weekly stats
    private AttendanceDTOs.WeeklyStats calculateWeeklyStats(List<Attendance> records) {
        AttendanceDTOs.WeeklyStats stats = new AttendanceDTOs.WeeklyStats();

        long presentCount = records.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
        long absentCount = records.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
        long halfDayCount = records.stream().filter(a -> a.getStatus() == AttendanceStatus.HALF_DAY).count();
        long leaveCount = records.stream().filter(a -> a.getStatus() == AttendanceStatus.ON_LEAVE).count();
        double totalHours = records.stream().mapToDouble(a -> a.getWorkHours() != null ? a.getWorkHours() : 0).sum();

        stats.setPresentCount((int) presentCount);
        stats.setAbsentCount((int) absentCount);
        stats.setHalfDayCount((int) halfDayCount);
        stats.setLeaveCount((int) leaveCount);
        stats.setAvgWorkHours(records.size() > 0 ? Math.round((totalHours / records.size()) * 100.0) / 100.0 : 0.0);

        return stats;
    }

    // Helper: Calculate monthly stats
    private AttendanceDTOs.MonthlyStats calculateMonthlyStats(List<Attendance> records, LocalDate monthStart,
            LocalDate monthEnd) {
        AttendanceDTOs.MonthlyStats stats = new AttendanceDTOs.MonthlyStats();

        // Count working days (exclude weekends)
        int workingDays = 0;
        for (LocalDate date = monthStart; !date.isAfter(monthEnd); date = date.plusDays(1)) {
            if (!isWeekend(date)) {
                workingDays++;
            }
        }

        long presentCount = records.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
        long halfDayCount = records.stream().filter(a -> a.getStatus() == AttendanceStatus.HALF_DAY).count();
        long absentCount = records.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
        long leaveCount = records.stream().filter(a -> a.getStatus() == AttendanceStatus.ON_LEAVE).count();
        double totalHours = records.stream().mapToDouble(a -> a.getWorkHours() != null ? a.getWorkHours() : 0).sum();

        double attendancePercent = workingDays > 0 ? ((presentCount + halfDayCount) / (double) workingDays) * 100 : 0;

        stats.setWorkingDays(workingDays);
        stats.setPresentCount((int) presentCount);
        stats.setAbsentCount((int) absentCount);
        stats.setHalfDayCount((int) halfDayCount);
        stats.setLeaveCount((int) leaveCount);
        stats.setAttendancePercent(Math.round(attendancePercent * 100.0) / 100.0);
        stats.setTotalWorkHours(Math.round(totalHours * 100.0) / 100.0);

        return stats;
    }

    // Helper: Check if date is weekend
    private boolean isWeekend(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
    }

    private AttendanceDTOs.Response toResponse(Attendance a) {
        AttendanceDTOs.Response r = new AttendanceDTOs.Response();
        r.setId(a.getId());
        r.setEmployeeDbId(a.getEmployee().getId());
        r.setEmployeeName(a.getEmployee().getFirstName() + " " + a.getEmployee().getLastName());
        r.setDate(a.getDate());
        r.setCheckIn(a.getCheckIn());
        r.setCheckOut(a.getCheckOut());
        r.setWorkHours(a.getWorkHours());
        r.setStatus(a.getStatus().name());
        r.setRemarks(a.getRemarks());
        return r;
    }
}