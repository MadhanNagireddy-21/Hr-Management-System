package com.hrms.service;

import com.hrms.dto.AttendanceDTOs;
import com.hrms.entity.Attendance;
import com.hrms.entity.AttendanceBreak;
import com.hrms.entity.Employee;
import com.hrms.entity.Holiday;
import com.hrms.enums.AttendanceStatus;
import com.hrms.enums.BreakType;
import com.hrms.repository.AttendanceBreakRepository;
import com.hrms.repository.AttendanceRepository;
import com.hrms.repository.EmployeeRepository;
import com.hrms.repository.HolidayRepository;
import lombok.RequiredArgsConstructor;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

        private final AttendanceRepository attendanceRepo;
        private final AttendanceBreakRepository attendanceBreakRepo;
        private final EmployeeService employeeService;
        private final EmployeeRepository employeeRepo;
        private final HolidayRepository holidayRepo;

        // ============================================================
        // ATTENDANCE CONSTANTS
        // ============================================================

        /**
         * Breaks longer than this duration are flagged.
         */
        private static final int FLAG_BREAK_MINUTES = 60;

        /**
         * Employees checking in after this time are considered late.
         */
        private static final LocalTime LATE_THRESHOLD = LocalTime.of(9, 15);

        /**
         * Application timezone.
         */
        private static final ZoneId IST_ZONE = ZoneId.of("Asia/Kolkata");

        // ============================================================
        // CHECK IN
        // ============================================================

        @Transactional
        public AttendanceDTOs.Response checkIn(
                        Long employeeId,
                        AttendanceDTOs.CheckInRequest req) {

                Employee emp = employeeService.findById(employeeId);

                LocalDate date = (req != null && req.getDate() != null)
                                ? req.getDate()
                                : LocalDate.now(IST_ZONE);

                // --------------------------------------------------------
                // WEEKEND
                // --------------------------------------------------------

                if (isWeekend(date)) {

                        throw new IllegalStateException(
                                        "Attendance cannot be marked on a weekend");
                }

                // --------------------------------------------------------
                // HOLIDAY
                // --------------------------------------------------------

                if (isHoliday(date)) {
                        Holiday holiday = holidayRepo
                                        .findByHolidayDate(date)
                                        .orElse(null);

                        String holidayName = holiday != null
                                        ? holiday.getHolidayName()
                                        : "Holiday";

                        throw new IllegalStateException(
                                        "Today is a holiday: " + holidayName);
                }

                // --------------------------------------------------------
                // DUPLICATE CHECK
                // --------------------------------------------------------

                if (attendanceRepo
                                .findByEmployeeAndDate(emp, date)
                                .isPresent()) {

                        throw new IllegalStateException(
                                        "Already checked in for " + date);
                }

                // --------------------------------------------------------
                // CHECK-IN TIME
                // --------------------------------------------------------

                LocalTime checkIn = (req != null && req.getCheckIn() != null)
                                ? req.getCheckIn()
                                : LocalTime.now(IST_ZONE).withNano(0);

                // --------------------------------------------------------
                // CREATE ATTENDANCE
                // --------------------------------------------------------

                Attendance att = Attendance.builder()
                                .employee(emp)
                                .date(date)
                                .checkIn(checkIn)
                                .status(AttendanceStatus.PRESENT)
                                .build();

                return toResponse(
                                attendanceRepo.save(att));
        }

        // ============================================================
        // CHECK OUT
        // ============================================================

        @Transactional
        public AttendanceDTOs.Response checkOut(
                        Long employeeId,
                        AttendanceDTOs.CheckOutRequest req) {

                Employee emp = employeeService.findById(employeeId);

                LocalDate today = LocalDate.now(IST_ZONE);

                Attendance att = attendanceRepo
                                .findByEmployeeAndDate(emp, today)
                                .or(() -> attendanceRepo
                                                .findFirstByEmployeeAndCheckOutIsNullOrderByDateDesc(emp))
                                .orElseThrow(
                                                () -> new com.hrms.exception.AttendanceRecordNotFound());

                LocalTime checkOut = (req != null && req.getCheckOut() != null)
                                ? req.getCheckOut()
                                : LocalTime.now(IST_ZONE).withNano(0);

                // --------------------------------------------------------
                // VALIDATE CHECKOUT
                // --------------------------------------------------------

                if (att.getCheckIn() == null) {

                        throw new IllegalStateException(
                                        "Check-in time is missing");
                }

                // --------------------------------------------------------
                // SET CHECKOUT
                // --------------------------------------------------------

                att.setCheckOut(checkOut);

                // --------------------------------------------------------
                // CLOSE OPEN BREAK
                // --------------------------------------------------------

                attendanceBreakRepo
                                .findFirstByAttendanceAndBreakEndIsNull(att)
                                .ifPresent(openBreak -> {

                                        closeBreak(
                                                        openBreak,
                                                        checkOut);

                                        attendanceBreakRepo.save(openBreak);
                                });

                // --------------------------------------------------------
                // RECALCULATE BREAK
                // --------------------------------------------------------

                recalculateTotalBreakMinutes(att);

                // --------------------------------------------------------
                // CALCULATE GROSS HOURS
                // --------------------------------------------------------

                double grossHours = att.getCheckIn()
                                .until(
                                                checkOut,
                                                ChronoUnit.MINUTES)
                                / 60.0;

                if (grossHours < 0) {
                        grossHours += 24.0;
                }

                // --------------------------------------------------------
                // BREAK HOURS
                // --------------------------------------------------------

                double breakHours = (att.getTotalBreakMinutes() != null
                                ? att.getTotalBreakMinutes()
                                : 0)
                                / 60.0;

                // --------------------------------------------------------
                // NET WORK HOURS
                // --------------------------------------------------------

                double netHours = Math.max(
                                0,
                                grossHours - breakHours);

                att.setWorkHours(
                                Math.round(
                                                netHours * 100.0)
                                                / 100.0);

                // --------------------------------------------------------
                // ATTENDANCE STATUS
                // --------------------------------------------------------

                if (netHours < 4) {

                        att.setStatus(
                                        AttendanceStatus.ABSENT);

                } else if (netHours < 8) {

                        att.setStatus(
                                        AttendanceStatus.HALF_DAY);

                } else {

                        att.setStatus(
                                        AttendanceStatus.PRESENT);
                }

                // --------------------------------------------------------
                // REMARKS
                // --------------------------------------------------------

                if (req != null
                                && req.getRemarks() != null
                                && !req.getRemarks().isBlank()) {

                        att.setRemarks(
                                        req.getRemarks());
                }

                return toResponse(
                                attendanceRepo.save(att));
        }

        // ============================================================
        // BREAK START
        // ============================================================

        @Transactional
        public AttendanceDTOs.Response breakStart(
                        Long employeeId,
                        AttendanceDTOs.BreakStartRequest req) {

                Employee emp = employeeService.findById(employeeId);

                LocalDate today = LocalDate.now(IST_ZONE);

                Attendance att = attendanceRepo
                                .findByEmployeeAndDate(
                                                emp,
                                                today)
                                .orElseThrow(
                                                () -> new IllegalStateException(
                                                                "Check in before starting a break"));

                // --------------------------------------------------------
                // CHECKOUT VALIDATION
                // --------------------------------------------------------

                if (att.getCheckOut() != null) {

                        throw new IllegalStateException(
                                        "Already checked out for today");
                }

                // --------------------------------------------------------
                // EXISTING OPEN BREAK
                // --------------------------------------------------------

                if (attendanceBreakRepo
                                .findFirstByAttendanceAndBreakEndIsNull(att)
                                .isPresent()) {

                        throw new IllegalStateException(
                                        "A break is already in progress");
                }

                // --------------------------------------------------------
                // BREAK START TIME
                // --------------------------------------------------------

                LocalTime start = (req != null
                                && req.getBreakStart() != null)
                                                ? req.getBreakStart()
                                                : LocalTime.now(IST_ZONE).withNano(0);

                // --------------------------------------------------------
                // BREAK TYPE
                // --------------------------------------------------------

                BreakType breakType = (req != null
                                && req.getBreakType() != null)
                                                ? req.getBreakType()
                                                : BreakType.GENERAL;

                // --------------------------------------------------------
                // CREATE BREAK
                // --------------------------------------------------------

                AttendanceBreak brk = AttendanceBreak.builder()
                                .attendance(att)
                                .breakType(breakType)
                                .breakStart(start)
                                .build();

                attendanceBreakRepo.save(brk);

                return toResponse(att);
        }

        // ============================================================
        // BREAK END
        // ============================================================

        @Transactional
        public AttendanceDTOs.Response breakEnd(
                        Long employeeId,
                        AttendanceDTOs.BreakEndRequest req) {

                Employee emp = employeeService.findById(employeeId);

                LocalDate today = LocalDate.now(IST_ZONE);

                Attendance att = attendanceRepo
                                .findByEmployeeAndDate(
                                                emp,
                                                today)
                                .orElseThrow(
                                                () -> new IllegalStateException(
                                                                "No attendance record for today"));

                // --------------------------------------------------------
                // FIND OPEN BREAK
                // --------------------------------------------------------

                AttendanceBreak brk = attendanceBreakRepo
                                .findFirstByAttendanceAndBreakEndIsNull(att)
                                .orElseThrow(
                                                () -> new IllegalStateException(
                                                                "No break in progress"));

                // --------------------------------------------------------
                // BREAK END TIME
                // --------------------------------------------------------

                LocalTime end = (req != null
                                && req.getBreakEnd() != null)
                                                ? req.getBreakEnd()
                                                : LocalTime.now(IST_ZONE).withNano(0);

                // --------------------------------------------------------
                // CLOSE BREAK
                // --------------------------------------------------------

                closeBreak(
                                brk,
                                end);

                attendanceBreakRepo.save(brk);

                // --------------------------------------------------------
                // RECALCULATE BREAK
                // --------------------------------------------------------

                recalculateTotalBreakMinutes(att);

                attendanceRepo.save(att);

                return toResponse(att);
        }

        // ============================================================
        // CLOSE BREAK
        // ============================================================

        private void closeBreak(
                        AttendanceBreak brk,
                        LocalTime end) {

                brk.setBreakEnd(end);

                int minutes = (int) brk.getBreakStart()
                                .until(
                                                end,
                                                ChronoUnit.MINUTES);

                if (minutes < 0) {
                        minutes += 24 * 60;
                }

                brk.setDurationMinutes(minutes);

                brk.setFlagged(
                                minutes > FLAG_BREAK_MINUTES);
        }

        // ============================================================
        // RECALCULATE BREAK MINUTES
        // ============================================================

        private void recalculateTotalBreakMinutes(
                        Attendance att) {

                List<AttendanceBreak> breaks = attendanceBreakRepo
                                .findByAttendanceOrderByBreakStartAsc(att);

                int totalUnpaid = breaks.stream()
                                .filter(
                                                b -> b.getDurationMinutes() != null
                                                                && !b.isPaid())
                                .mapToInt(
                                                AttendanceBreak::getDurationMinutes)
                                .sum();

                att.setTotalBreakMinutes(
                                totalUnpaid);
        }

        // ============================================================
        // MY ATTENDANCE
        // ============================================================

        @Transactional(readOnly = true)
        public Page<AttendanceDTOs.Response> getMyAttendance(
                        Long employeeId,
                        Pageable pageable) {

                Employee emp = employeeService.findById(employeeId);

                return attendanceRepo
                                .findByEmployee(
                                                emp,
                                                pageable)
                                .map(this::toResponse);
        }

        // ============================================================
        // ATTENDANCE BY DATE
        // ============================================================

        @Transactional(readOnly = true)
        public Page<AttendanceDTOs.Response> getAttendanceByDate(
                        LocalDate date,
                        Pageable pageable) {

                return attendanceRepo
                                .findByDate(
                                                date,
                                                pageable)
                                .map(this::toResponse);
        }

        // ============================================================
        // DELETE MY ATTENDANCE
        // ============================================================

        @Transactional
        public void deleteMyAttendance(
                        Long employeeId,
                        Long attendanceId) {

                Employee emp = employeeService.findById(employeeId);

                Attendance attendance = attendanceRepo
                                .findById(attendanceId)
                                .orElseThrow(
                                                () -> new IllegalStateException(
                                                                "Attendance record not found"));

                if (!attendance.getEmployee()
                                .getId()
                                .equals(emp.getId())) {

                        throw new IllegalStateException(
                                        "You are not allowed to delete this attendance record");
                }

                attendanceRepo.delete(attendance);
        }

        // ============================================================
        // CLEAR MY ATTENDANCE
        // ============================================================

        @Transactional
        public void clearMyAttendance(
                        Long employeeId) {

                Employee emp = employeeService.findById(employeeId);

                List<Attendance> attendanceRecords = attendanceRepo.findByEmployee(emp);

                attendanceRepo.deleteAll(
                                attendanceRecords);
        }

        // ============================================================
        // EMPLOYEE DETAILED REPORT
        // ============================================================

        @Transactional(readOnly = true)
        public AttendanceDTOs.EmployeeDetailedReport getEmployeeDetailedReport(
                        Long employeeId,
                        LocalDate asOfDate) {

                Employee emp = employeeService.findById(employeeId);

                LocalDate yesterday = asOfDate.minusDays(1);

                Attendance yesterdayRecord = attendanceRepo
                                .findByEmployeeAndDate(
                                                emp,
                                                yesterday)
                                .orElse(null);

                // --------------------------------------------------------
                // WEEK
                // --------------------------------------------------------

                LocalDate weekStart = asOfDate.minusDays(6);

                List<Attendance> weekRecords = attendanceRepo
                                .findByEmployeeAndDateRangeOrderByDate(
                                                emp,
                                                weekStart,
                                                asOfDate);

                // --------------------------------------------------------
                // MONTH
                // --------------------------------------------------------

                YearMonth yearMonth = YearMonth.from(asOfDate);

                LocalDate monthStart = yearMonth.atDay(1);

                LocalDate monthEnd = yearMonth.atEndOfMonth();

                List<Attendance> monthRecords = attendanceRepo
                                .findByEmployeeAndDateRangeOrderByDate(
                                                emp,
                                                monthStart,
                                                monthEnd);

                // --------------------------------------------------------
                // WEEKLY RECORDS
                // --------------------------------------------------------

                List<AttendanceDTOs.DailyRecord> weeklyRecords = buildDailyRecords(
                                weekStart,
                                asOfDate,
                                weekRecords);

                AttendanceDTOs.WeeklyStats weeklyStats = calculateWeeklyStats(
                                weekRecords);

                // --------------------------------------------------------
                // MONTHLY RECORDS
                // --------------------------------------------------------

                List<AttendanceDTOs.DailyRecord> monthlyRecords = buildDailyRecords(
                                monthStart,
                                monthEnd,
                                monthRecords);

                AttendanceDTOs.MonthlyStats monthlyStats = calculateMonthlyStats(
                                monthRecords,
                                monthStart,
                                monthEnd);

                // --------------------------------------------------------
                // YESTERDAY STATUS
                // --------------------------------------------------------

                String yesterdayStatus;

                if (isWeekend(yesterday)) {

                        yesterdayStatus = "WEEKEND";

                } else if (isHoliday(yesterday)) {

                        yesterdayStatus = "HOLIDAY";

                } else {

                        yesterdayStatus = yesterdayRecord != null
                                        ? yesterdayRecord.getStatus().name()
                                        : "ABSENT";
                }

                // --------------------------------------------------------
                // RESPONSE
                // --------------------------------------------------------

                return new AttendanceDTOs.EmployeeDetailedReport(

                                emp.getId(),

                                emp.getEmployeeId(),

                                emp.getFirstName()
                                                + " "
                                                + emp.getLastName(),

                                emp.getDepartment() != null
                                                ? emp.getDepartment()
                                                : "N/A",

                                yesterday,

                                yesterdayStatus,

                                yesterdayRecord != null
                                                ? yesterdayRecord.getCheckIn()
                                                : null,

                                yesterdayRecord != null
                                                ? yesterdayRecord.getCheckOut()
                                                : null,

                                yesterdayRecord != null
                                                ? yesterdayRecord.getWorkHours()
                                                : 0.0,

                                yesterdayRecord != null
                                                ? yesterdayRecord.getRemarks()
                                                : null,

                                weeklyRecords,
                                weeklyStats,

                                monthlyRecords,
                                monthlyStats);
        }

        // ============================================================
        // EMPLOYEE ATTENDANCE SUMMARY
        // ============================================================

        @Transactional(readOnly = true)
        public AttendanceDTOs.EmployeeAttendanceSummary getEmployeeAttendanceSummary(
                        Long employeeId,
                        LocalDate date) {

                Employee emp = employeeService.findById(employeeId);

                Attendance att = attendanceRepo
                                .findByEmployeeAndDate(
                                                emp,
                                                date)
                                .orElse(null);

                AttendanceDTOs.EmployeeAttendanceSummary summary = new AttendanceDTOs.EmployeeAttendanceSummary();

                summary.setEmployeeId(
                                emp.getId());

                summary.setEmployeeCode(
                                emp.getEmployeeId());

                summary.setEmployeeName(
                                emp.getFirstName()
                                                + " "
                                                + emp.getLastName());

                summary.setDepartmentName(
                                emp.getDepartment() != null
                                                ? emp.getDepartment()
                                                : "N/A");

                // --------------------------------------------------------
                // WEEKEND
                // --------------------------------------------------------

                if (isWeekend(date)) {

                        summary.setStatus("WEEKEND");
                        summary.setWorkHours(0.0);

                        return summary;
                }

                // --------------------------------------------------------
                // HOLIDAY
                // --------------------------------------------------------

                if (isHoliday(date)) {

                        summary.setStatus("HOLIDAY");
                        summary.setWorkHours(0.0);

                        return summary;
                }

                // --------------------------------------------------------
                // ATTENDANCE
                // --------------------------------------------------------

                if (att != null) {

                        summary.setStatus(
                                        att.getStatus().name());

                        summary.setCheckIn(
                                        att.getCheckIn());

                        summary.setCheckOut(
                                        att.getCheckOut());

                        summary.setWorkHours(
                                        att.getWorkHours());

                        summary.setTotalBreakMinutes(
                                        att.getTotalBreakMinutes());

                        summary.setBreaks(
                                        att.getBreaks()
                                                        .stream()
                                                        .map(this::toBreakResponse)
                                                        .collect(Collectors.toList()));

                        summary.setOnBreak(
                                        att.getBreaks()
                                                        .stream()
                                                        .anyMatch(
                                                                        b -> b.getBreakEnd() == null));

                } else {

                        summary.setStatus("ABSENT");
                        summary.setWorkHours(0.0);
                }

                return summary;
        }

        // ============================================================
        // ALL EMPLOYEES SUMMARY
        // ============================================================

        @Transactional(readOnly = true)
        public Page<AttendanceDTOs.EmployeeAttendanceSummary> getAllEmployeesSummaryByDate(
                        LocalDate date,
                        Pageable pageable) {

                return attendanceRepo
                                .findByDate(
                                                date,
                                                pageable)
                                .map(att -> {

                                        AttendanceDTOs.EmployeeAttendanceSummary summary = new AttendanceDTOs.EmployeeAttendanceSummary();

                                        summary.setEmployeeId(
                                                        att.getEmployee().getId());

                                        summary.setEmployeeCode(
                                                        att.getEmployee().getEmployeeId());

                                        summary.setEmployeeName(
                                                        att.getEmployee().getFirstName()
                                                                        + " "
                                                                        + att.getEmployee().getLastName());

                                        summary.setDepartmentName(
                                                        att.getEmployee().getDepartment() != null
                                                                        ? att.getEmployee().getDepartment()
                                                                        : "N/A");

                                        summary.setStatus(
                                                        att.getStatus().name());

                                        summary.setCheckIn(
                                                        att.getCheckIn());

                                        summary.setCheckOut(
                                                        att.getCheckOut());

                                        summary.setWorkHours(
                                                        att.getWorkHours());

                                        summary.setTotalBreakMinutes(
                                                        att.getTotalBreakMinutes());

                                        summary.setBreaks(
                                                        att.getBreaks()
                                                                        .stream()
                                                                        .map(this::toBreakResponse)
                                                                        .collect(Collectors.toList()));

                                        summary.setOnBreak(
                                                        att.getBreaks()
                                                                        .stream()
                                                                        .anyMatch(
                                                                                        b -> b.getBreakEnd() == null));

                                        return summary;
                                });
        }

        // ============================================================
        // EXPORT ALL EMPLOYEES
        // ============================================================

        @Transactional(readOnly = true)
        public byte[] exportAttendanceRange(
                        LocalDate from,
                        LocalDate to,
                        String status,
                        String search) {

                List<Employee> employees = employeeRepo.findByActiveTrue();

                // --------------------------------------------------------
                // SEARCH
                // --------------------------------------------------------

                if (search != null
                                && !search.isBlank()) {

                        String q = search.toLowerCase();

                        employees = employees.stream()
                                        .filter(
                                                        e -> (e.getFirstName()
                                                                        + " "
                                                                        + e.getLastName())
                                                                        .toLowerCase()
                                                                        .contains(q)
                                                                        ||
                                                                        e.getEmployeeId()
                                                                                        .toLowerCase()
                                                                                        .contains(q))
                                        .collect(Collectors.toList());
                }

                // --------------------------------------------------------
                // BUILD EXPORT DATA
                // --------------------------------------------------------

                List<Map.Entry<Employee, Map<LocalDate, Attendance>>> exportData = new ArrayList<>();

                for (Employee emp : employees) {

                        List<Attendance> records = attendanceRepo
                                        .findByEmployeeAndDateRangeOrderByDate(
                                                        emp,
                                                        from,
                                                        to);

                        Map<LocalDate, Attendance> recordMap = records.stream()
                                        .collect(
                                                        Collectors.toMap(
                                                                        Attendance::getDate,
                                                                        a -> a));

                        // ----------------------------------------------------
                        // STATUS FILTER
                        // ----------------------------------------------------

                        if (status != null
                                        && !status.isBlank()
                                        && !status.equalsIgnoreCase("ALL")) {

                                boolean matches = recordMap.values()
                                                .stream()
                                                .anyMatch(
                                                                a -> a.getStatus()
                                                                                .name()
                                                                                .equalsIgnoreCase(status));

                                if (!matches) {
                                        continue;
                                }
                        }

                        exportData.add(
                                        Map.entry(
                                                        emp,
                                                        recordMap));
                }

                return buildAttendanceWorkbook(
                                exportData,
                                from,
                                to);
        }

        // ============================================================
        // EXPORT SINGLE EMPLOYEE
        // ============================================================

        @Transactional(readOnly = true)
        public byte[] exportEmployeeAttendanceRange(
                        Long employeeId,
                        LocalDate from,
                        LocalDate to) {

                Employee emp = employeeService.findById(employeeId);

                List<Attendance> records = attendanceRepo
                                .findByEmployeeAndDateRangeOrderByDate(
                                                emp,
                                                from,
                                                to);

                Map<LocalDate, Attendance> recordMap = records.stream()
                                .collect(
                                                Collectors.toMap(
                                                                Attendance::getDate,
                                                                a -> a));

                return buildAttendanceWorkbook(
                                List.of(
                                                Map.entry(
                                                                emp,
                                                                recordMap)),
                                from,
                                to);
        }

        // ============================================================
        // BUILD EXCEL WORKBOOK
        // ============================================================

        private byte[] buildAttendanceWorkbook(
                        List<Map.Entry<Employee, Map<LocalDate, Attendance>>> data,
                        LocalDate from,
                        LocalDate to) {

                try (
                                XSSFWorkbook wb = new XSSFWorkbook();

                                ByteArrayOutputStream out = new ByteArrayOutputStream()) {

                        Sheet sheet = wb.createSheet("Attendance");

                        // ----------------------------------------------------
                        // HEADER STYLE
                        // ----------------------------------------------------

                        CellStyle headerStyle = wb.createCellStyle();

                        Font headerFont = wb.createFont();

                        headerFont.setBold(true);

                        headerFont.setColor(
                                        IndexedColors.WHITE.getIndex());

                        headerStyle.setFont(
                                        headerFont);

                        headerStyle.setFillForegroundColor(
                                        IndexedColors.GREY_80_PERCENT.getIndex());

                        headerStyle.setFillPattern(
                                        FillPatternType.SOLID_FOREGROUND);

                        headerStyle.setAlignment(
                                        HorizontalAlignment.CENTER);

                        // ----------------------------------------------------
                        // STATUS STYLES
                        // ----------------------------------------------------

                        Map<AttendanceStatus, CellStyle> statusStyles = new HashMap<>();

                        statusStyles.put(
                                        AttendanceStatus.PRESENT,
                                        coloredStyle(
                                                        wb,
                                                        IndexedColors.LIGHT_GREEN));

                        statusStyles.put(
                                        AttendanceStatus.HALF_DAY,
                                        coloredStyle(
                                                        wb,
                                                        IndexedColors.LIGHT_ORANGE));

                        statusStyles.put(
                                        AttendanceStatus.ABSENT,
                                        coloredStyle(
                                                        wb,
                                                        IndexedColors.ROSE));

                        statusStyles.put(
                                        AttendanceStatus.ON_LEAVE,
                                        coloredStyle(
                                                        wb,
                                                        IndexedColors.PALE_BLUE));

                        CellStyle weekendStyle = coloredStyle(
                                        wb,
                                        IndexedColors.GREY_25_PERCENT);

                        CellStyle holidayStyle = coloredStyle(
                                        wb,
                                        IndexedColors.LIGHT_YELLOW);

                        // ----------------------------------------------------
                        // DAYS
                        // ----------------------------------------------------

                        List<LocalDate> days = new ArrayList<>();

                        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {

                                days.add(d);
                        }

                        // ----------------------------------------------------
                        // HEADERS
                        // ----------------------------------------------------

                        List<String> headers = new ArrayList<>(
                                        List.of(
                                                        "Name",
                                                        "Employee ID",
                                                        "Department",
                                                        "Role",
                                                        "Employment status"));

                        for (LocalDate d : days) {
                                headers.add(
                                                d.toString());
                        }

                        headers.addAll(
                                        List.of(
                                                        "Total hours",
                                                        "Total break (min)",
                                                        "Present",
                                                        "Half day",
                                                        "Absent",
                                                        "Leave",
                                                        "Late arrivals"));

                        Row headerRow = sheet.createRow(0);

                        for (int i = 0; i < headers.size(); i++) {

                                Cell c = headerRow.createCell(i);

                                c.setCellValue(
                                                headers.get(i));

                                c.setCellStyle(
                                                headerStyle);
                        }

                        // ----------------------------------------------------
                        // EMPLOYEE ROWS
                        // ----------------------------------------------------

                        int rowIdx = 1;

                        for (Map.Entry<Employee, Map<LocalDate, Attendance>> entry : data) {

                                Employee emp = entry.getKey();

                                Map<LocalDate, Attendance> recordMap = entry.getValue();

                                Row row = sheet.createRow(
                                                rowIdx++);

                                row.createCell(0)
                                                .setCellValue(
                                                                emp.getFirstName()
                                                                                + " "
                                                                                + emp.getLastName());

                                row.createCell(1)
                                                .setCellValue(
                                                                emp.getEmployeeId());

                                row.createCell(2)
                                                .setCellValue(
                                                                emp.getDepartment() != null
                                                                                ? emp.getDepartment()
                                                                                : "N/A");

                                row.createCell(3)
                                                .setCellValue(
                                                                emp.getDesignation() != null
                                                                                ? emp.getDesignation()
                                                                                : "N/A");

                                row.createCell(4)
                                                .setCellValue(
                                                                emp.isActive()
                                                                                ? "Active"
                                                                                : "Inactive");

                                int present = 0;
                                int half = 0;
                                int absent = 0;
                                int leave = 0;
                                int late = 0;

                                double totalHours = 0;

                                int totalBreakMin = 0;

                                int col = 5;

                                // ------------------------------------------------
                                // EACH DATE
                                // ------------------------------------------------

                                for (LocalDate d : days) {

                                        Cell cell = row.createCell(
                                                        col++);

                                        // ------------------------------------------------
                                        // WEEKEND
                                        // ------------------------------------------------

                                        if (isWeekend(d)) {

                                                cell.setCellValue(
                                                                "WK");

                                                cell.setCellStyle(
                                                                weekendStyle);

                                                continue;
                                        }

                                        // ------------------------------------------------
                                        // HOLIDAY
                                        // ------------------------------------------------

                                        if (isHoliday(d)) {

                                                Holiday holiday = holidayRepo
                                                                .findByHolidayDate(d)
                                                                .orElse(null);

                                                String holidayName = holiday != null
                                                                ? holiday.getHolidayName()
                                                                : "Holiday";

                                                cell.setCellValue(
                                                                "HOL - "
                                                                                + holidayName);

                                                cell.setCellStyle(
                                                                holidayStyle);

                                                continue;
                                        }

                                        // ------------------------------------------------
                                        // ATTENDANCE
                                        // ------------------------------------------------

                                        Attendance att = recordMap.get(d);

                                        if (att == null) {

                                                cell.setCellValue(
                                                                "A");

                                                cell.setCellStyle(
                                                                statusStyles.get(
                                                                                AttendanceStatus.ABSENT));

                                                absent++;

                                                continue;
                                        }

                                        AttendanceStatus st = att.getStatus();

                                        // ------------------------------------------------
                                        // BREAK INFORMATION
                                        // ------------------------------------------------

                                        List<AttendanceBreak> dayBreaks = att.getBreaks();

                                        String breakSuffix = "";

                                        if (dayBreaks != null
                                                        && !dayBreaks.isEmpty()) {

                                                String ranges = dayBreaks.stream()
                                                                .map(
                                                                                b -> fmt(
                                                                                                b.getBreakStart())
                                                                                                + "-"
                                                                                                + (b.getBreakEnd() != null
                                                                                                                ? fmt(
                                                                                                                                b.getBreakEnd())
                                                                                                                : "..."))
                                                                .collect(
                                                                                Collectors.joining(
                                                                                                ", "));

                                                breakSuffix = " [brk "
                                                                + ranges
                                                                + "]";
                                        }

                                        // ------------------------------------------------
                                        // LABEL
                                        // ------------------------------------------------

                                        String label;

                                        switch (st) {

                                                case PRESENT:

                                                        label = "P ("
                                                                        + fmt(
                                                                                        att.getCheckIn())
                                                                        + "-"
                                                                        + fmt(
                                                                                        att.getCheckOut())
                                                                        + ")"
                                                                        + breakSuffix;

                                                        break;

                                                case HALF_DAY:

                                                        label = "H ("
                                                                        + fmt(
                                                                                        att.getCheckIn())
                                                                        + "-"
                                                                        + fmt(
                                                                                        att.getCheckOut())
                                                                        + ")"
                                                                        + breakSuffix;

                                                        break;

                                                case ON_LEAVE:

                                                        label = "L";

                                                        break;

                                                default:

                                                        label = "A";
                                        }

                                        cell.setCellValue(
                                                        label);

                                        if (statusStyles.containsKey(st)) {

                                                cell.setCellStyle(
                                                                statusStyles.get(st));
                                        }

                                        // ------------------------------------------------
                                        // COUNTS
                                        // ------------------------------------------------

                                        if (st == AttendanceStatus.PRESENT) {

                                                present++;

                                        } else if (st == AttendanceStatus.HALF_DAY) {

                                                half++;

                                        } else if (st == AttendanceStatus.ON_LEAVE) {

                                                leave++;

                                        } else if (st == AttendanceStatus.ABSENT) {

                                                absent++;
                                        }

                                        // ------------------------------------------------
                                        // HOURS
                                        // ------------------------------------------------

                                        if (att.getWorkHours() != null) {

                                                totalHours += att.getWorkHours();
                                        }

                                        // ------------------------------------------------
                                        // BREAK
                                        // ------------------------------------------------

                                        if (att.getTotalBreakMinutes() != null) {

                                                totalBreakMin += att.getTotalBreakMinutes();
                                        }

                                        // ------------------------------------------------
                                        // LATE
                                        // ------------------------------------------------

                                        if (att.getCheckIn() != null
                                                        &&
                                                        att.getCheckIn()
                                                                        .isAfter(
                                                                                        LATE_THRESHOLD)) {

                                                late++;
                                        }
                                }

                                // ----------------------------------------------------
                                // SUMMARY
                                // ----------------------------------------------------

                                row.createCell(col++)
                                                .setCellValue(
                                                                Math.round(
                                                                                totalHours * 100.0)
                                                                                / 100.0);

                                row.createCell(col++)
                                                .setCellValue(
                                                                totalBreakMin);

                                row.createCell(col++)
                                                .setCellValue(
                                                                present);

                                row.createCell(col++)
                                                .setCellValue(
                                                                half);

                                row.createCell(col++)
                                                .setCellValue(
                                                                absent);

                                row.createCell(col++)
                                                .setCellValue(
                                                                leave);

                                row.createCell(col)
                                                .setCellValue(
                                                                late);
                        }

                        // ----------------------------------------------------
                        // AUTO SIZE
                        // ----------------------------------------------------

                        for (int i = 0; i < headers.size(); i++) {

                                sheet.autoSizeColumn(i);
                        }

                        wb.write(out);

                        return out.toByteArray();

                } catch (IOException e) {

                        throw new UncheckedIOException(e);
                }
        }

        // ============================================================
        // COLORED EXCEL STYLE
        // ============================================================

        private CellStyle coloredStyle(
                        XSSFWorkbook wb,
                        IndexedColors color) {

                CellStyle style = wb.createCellStyle();

                style.setFillForegroundColor(
                                color.getIndex());

                style.setFillPattern(
                                FillPatternType.SOLID_FOREGROUND);

                style.setAlignment(
                                HorizontalAlignment.CENTER);

                return style;
        }

        // ============================================================
        // TIME FORMAT
        // ============================================================

        private String fmt(LocalTime t) {

                return t == null
                                ? "--"
                                : t.toString().substring(
                                                0,
                                                5);
        }

        // ============================================================
        // DAILY RECORDS
        // ============================================================

        private List<AttendanceDTOs.DailyRecord> buildDailyRecords(
                        LocalDate rangeStart,
                        LocalDate rangeEnd,
                        List<Attendance> records) {

                Map<LocalDate, Attendance> recordMap = records.stream()
                                .collect(
                                                Collectors.toMap(
                                                                Attendance::getDate,
                                                                a -> a));

                List<AttendanceDTOs.DailyRecord> dailyRecords = new ArrayList<>();

                for (LocalDate date = rangeStart; !date.isAfter(rangeEnd); date = date.plusDays(1)) {

                        String dayName = date.getDayOfWeek()
                                        .toString()
                                        .substring(0, 3);

                        AttendanceDTOs.DailyRecord day = new AttendanceDTOs.DailyRecord();

                        day.setDate(date);

                        day.setDayName(
                                        dayName);

                        // ----------------------------------------------------
                        // WEEKEND
                        // ----------------------------------------------------

                        if (isWeekend(date)) {

                                day.setStatus(
                                                "WEEKEND");

                                // ----------------------------------------------------
                                // HOLIDAY
                                // ----------------------------------------------------

                        } else if (isHoliday(date)) {

                                day.setStatus(
                                                "HOLIDAY");

                                Holiday holiday = holidayRepo
                                                .findByHolidayDate(date)
                                                .orElse(null);

                                if (holiday != null) {

                                        day.setRemarks(
                                                        holiday.getHolidayName());
                                }

                                // ----------------------------------------------------
                                // ATTENDANCE
                                // ----------------------------------------------------

                        } else if (recordMap.containsKey(date)) {

                                Attendance att = recordMap.get(date);

                                day.setStatus(
                                                att.getStatus().name());

                                day.setCheckIn(
                                                att.getCheckIn());

                                day.setCheckOut(
                                                att.getCheckOut());

                                day.setWorkHours(
                                                att.getWorkHours());

                                day.setRemarks(
                                                att.getRemarks());

                                day.setTotalBreakMinutes(
                                                att.getTotalBreakMinutes());

                                day.setBreaks(
                                                att.getBreaks()
                                                                .stream()
                                                                .map(
                                                                                this::toBreakResponse)
                                                                .collect(
                                                                                Collectors.toList()));

                        } else {

                                day.setStatus(
                                                "ABSENT");
                        }

                        dailyRecords.add(day);
                }

                return dailyRecords;
        }

        // ============================================================
        // WEEKLY STATS
        // ============================================================

        private AttendanceDTOs.WeeklyStats calculateWeeklyStats(
                        List<Attendance> records) {

                AttendanceDTOs.WeeklyStats stats = new AttendanceDTOs.WeeklyStats();

                long presentCount = records.stream()
                                .filter(
                                                a -> a.getStatus() == AttendanceStatus.PRESENT)
                                .count();

                long absentCount = records.stream()
                                .filter(
                                                a -> a.getStatus() == AttendanceStatus.ABSENT)
                                .count();

                long halfDayCount = records.stream()
                                .filter(
                                                a -> a.getStatus() == AttendanceStatus.HALF_DAY)
                                .count();

                long leaveCount = records.stream()
                                .filter(
                                                a -> a.getStatus() == AttendanceStatus.ON_LEAVE)
                                .count();

                double totalHours = records.stream()
                                .mapToDouble(
                                                a -> a.getWorkHours() != null
                                                                ? a.getWorkHours()
                                                                : 0)
                                .sum();

                stats.setPresentCount(
                                (int) presentCount);

                stats.setAbsentCount(
                                (int) absentCount);

                stats.setHalfDayCount(
                                (int) halfDayCount);

                stats.setLeaveCount(
                                (int) leaveCount);

                stats.setAvgWorkHours(
                                records.size() > 0
                                                ? Math.round(
                                                                (totalHours
                                                                                / records.size())
                                                                                * 100.0)
                                                                / 100.0
                                                : 0.0);

                return stats;
        }

        // ============================================================
        // MONTHLY STATS
        // ============================================================

        private AttendanceDTOs.MonthlyStats calculateMonthlyStats(
                        List<Attendance> records,
                        LocalDate monthStart,
                        LocalDate monthEnd) {

                AttendanceDTOs.MonthlyStats stats = new AttendanceDTOs.MonthlyStats();

                int workingDays = 0;

                for (LocalDate date = monthStart; !date.isAfter(monthEnd); date = date.plusDays(1)) {

                        if (!isWeekend(date)
                                        && !isHoliday(date)) {

                                workingDays++;
                        }
                }

                long presentCount = records.stream()
                                .filter(
                                                a -> a.getStatus() == AttendanceStatus.PRESENT)
                                .count();

                long halfDayCount = records.stream()
                                .filter(
                                                a -> a.getStatus() == AttendanceStatus.HALF_DAY)
                                .count();

                long absentCount = records.stream()
                                .filter(
                                                a -> a.getStatus() == AttendanceStatus.ABSENT)
                                .count();

                long leaveCount = records.stream()
                                .filter(
                                                a -> a.getStatus() == AttendanceStatus.ON_LEAVE)
                                .count();

                double totalHours = records.stream()
                                .mapToDouble(
                                                a -> a.getWorkHours() != null
                                                                ? a.getWorkHours()
                                                                : 0)
                                .sum();

                double attendancePercent = workingDays > 0
                                ? ((presentCount
                                                + halfDayCount)
                                                / (double) workingDays)
                                                * 100
                                : 0;

                stats.setWorkingDays(
                                workingDays);

                stats.setPresentCount(
                                (int) presentCount);

                stats.setAbsentCount(
                                (int) absentCount);

                stats.setHalfDayCount(
                                (int) halfDayCount);

                stats.setLeaveCount(
                                (int) leaveCount);

                stats.setAttendancePercent(
                                Math.round(
                                                attendancePercent * 100.0)
                                                / 100.0);

                stats.setTotalWorkHours(
                                Math.round(
                                                totalHours * 100.0)
                                                / 100.0);

                return stats;
        }

        // ============================================================
        // WEEKEND
        // ============================================================

        private boolean isWeekend(
                        LocalDate date) {

                DayOfWeek day = date.getDayOfWeek();

                return day == DayOfWeek.SATURDAY
                                || day == DayOfWeek.SUNDAY;
        }

        // ============================================================
        // HOLIDAY CHECK
        // ============================================================

        private boolean isHoliday(
                        LocalDate date) {

                if (date == null) {
                        return false;
                }

                return holidayRepo
                                .findByHolidayDate(date)
                                .isPresent();
        }

        // ============================================================
        // ATTENDANCE RESPONSE
        // ============================================================

        private AttendanceDTOs.Response toResponse(
                        Attendance a) {

                AttendanceDTOs.Response r = new AttendanceDTOs.Response();

                r.setId(
                                a.getId());

                r.setEmployeeDbId(
                                a.getEmployee().getId());

                r.setEmployeeName(
                                a.getEmployee().getFirstName()
                                                + " "
                                                + a.getEmployee().getLastName());

                r.setDate(
                                a.getDate());

                r.setCheckIn(
                                a.getCheckIn());

                r.setCheckOut(
                                a.getCheckOut());

                r.setWorkHours(
                                a.getWorkHours());

                r.setStatus(
                                a.getStatus().name());

                r.setRemarks(
                                a.getRemarks());

                r.setTotalBreakMinutes(
                                a.getTotalBreakMinutes());

                r.setOnBreak(
                                a.getBreaks()
                                                .stream()
                                                .anyMatch(
                                                                b -> b.getBreakEnd() == null));

                r.setBreaks(
                                a.getBreaks()
                                                .stream()
                                                .map(
                                                                this::toBreakResponse)
                                                .collect(
                                                                Collectors.toList()));

                return r;
        }

        // ============================================================
        // BREAK RESPONSE
        // ============================================================

        private AttendanceDTOs.BreakResponse toBreakResponse(
                        AttendanceBreak b) {

                AttendanceDTOs.BreakResponse br = new AttendanceDTOs.BreakResponse();

                br.setId(
                                b.getId());

                br.setBreakType(
                                b.getBreakType().name());

                br.setBreakStart(
                                b.getBreakStart());

                br.setBreakEnd(
                                b.getBreakEnd());

                br.setDurationMinutes(
                                b.getDurationMinutes());

                br.setPaid(
                                b.isPaid());

                br.setFlagged(
                                b.isFlagged());

                return br;
        }
}
