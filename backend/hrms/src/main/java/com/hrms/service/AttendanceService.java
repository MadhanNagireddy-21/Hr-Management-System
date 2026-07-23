package com.hrms.service;

import com.hrms.dto.AttendanceDTOs;
import com.hrms.entity.Attendance;
import com.hrms.entity.Employee;
import com.hrms.enums.AttendanceStatus;
import com.hrms.repository.AttendanceRepository;
import com.hrms.repository.EmployeeRepository;
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
    private final EmployeeRepository employeeRepo;

    private static final LocalTime LATE_THRESHOLD = LocalTime.of(9, 15);

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

    @Transactional(readOnly = true)
    public AttendanceDTOs.EmployeeDetailedReport getEmployeeDetailedReport(Long employeeId, LocalDate asOfDate) {
        Employee emp = employeeService.findById(employeeId);

        LocalDate yesterday = asOfDate.minusDays(1);
        Attendance yesterdayRecord = attendanceRepo.findByEmployeeAndDate(emp, yesterday).orElse(null);

        LocalDate weekStart = asOfDate.minusDays(6);
        List<Attendance> weekRecords = attendanceRepo.findByEmployeeAndDateRangeOrderByDate(emp, weekStart, asOfDate);

        YearMonth yearMonth = YearMonth.from(asOfDate);
        LocalDate monthStart = yearMonth.atDay(1);
        LocalDate monthEnd = yearMonth.atEndOfMonth();
        List<Attendance> monthRecords = attendanceRepo.findByEmployeeAndDateRangeOrderByDate(emp, monthStart, monthEnd);

        List<AttendanceDTOs.DailyRecord> weeklyRecords = buildWeeklyRecords(emp, weekStart, asOfDate, weekRecords);
        AttendanceDTOs.WeeklyStats weeklyStats = calculateWeeklyStats(weekRecords);

        List<AttendanceDTOs.DailyRecord> monthlyRecords = buildMonthlyRecords(emp, monthStart, monthEnd, monthRecords);
        AttendanceDTOs.MonthlyStats monthlyStats = calculateMonthlyStats(monthRecords, monthStart, monthEnd);

        return new AttendanceDTOs.EmployeeDetailedReport(
                emp.getId(),
                emp.getEmployeeId(),
                emp.getFirstName() + " " + emp.getLastName(),
                emp.getDepartment() != null ? emp.getDepartment() : "N/A",
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

    @Transactional(readOnly = true)
    public AttendanceDTOs.EmployeeAttendanceSummary getEmployeeAttendanceSummary(Long employeeId, LocalDate date) {
        Employee emp = employeeService.findById(employeeId);
        Attendance att = attendanceRepo.findByEmployeeAndDate(emp, date).orElse(null);

        AttendanceDTOs.EmployeeAttendanceSummary summary = new AttendanceDTOs.EmployeeAttendanceSummary();
        summary.setEmployeeId(emp.getId());
        summary.setEmployeeCode(emp.getEmployeeId());
        summary.setEmployeeName(emp.getFirstName() + " " + emp.getLastName());
        summary.setDepartmentName(emp.getDepartment() != null ? emp.getDepartment() : "N/A");

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

    @Transactional(readOnly = true)
    public Page<AttendanceDTOs.EmployeeAttendanceSummary> getAllEmployeesSummaryByDate(LocalDate date,
            Pageable pageable) {
        return attendanceRepo.findByDate(date, pageable)
                .map(att -> {
                    AttendanceDTOs.EmployeeAttendanceSummary summary = new AttendanceDTOs.EmployeeAttendanceSummary();
                    summary.setEmployeeId(att.getEmployee().getId());
                    summary.setEmployeeCode(att.getEmployee().getEmployeeId());
                    summary.setEmployeeName(att.getEmployee().getFirstName() + " " + att.getEmployee().getLastName());
                    summary.setDepartmentName(
                            att.getEmployee().getDepartment() != null ? att.getEmployee().getDepartment() : "N/A");
                    summary.setStatus(att.getStatus().name());
                    summary.setCheckIn(att.getCheckIn());
                    summary.setCheckOut(att.getCheckOut());
                    summary.setWorkHours(att.getWorkHours());
                    return summary;
                });
    }

    // ===== EXPORT: all employees, date range =====
    @Transactional(readOnly = true)
    public byte[] exportAttendanceRange(LocalDate from, LocalDate to, String status, String search) {
        List<Employee> employees = employeeRepo.findByActiveTrue();

        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            employees = employees.stream()
                    .filter(e -> (e.getFirstName() + " " + e.getLastName()).toLowerCase().contains(q)
                            || e.getEmployeeId().toLowerCase().contains(q))
                    .collect(Collectors.toList());
        }

        List<Map.Entry<Employee, Map<LocalDate, Attendance>>> exportData = new ArrayList<>();
        for (Employee emp : employees) {
            List<Attendance> records = attendanceRepo.findByEmployeeAndDateRangeOrderByDate(emp, from, to);
            Map<LocalDate, Attendance> recordMap = records.stream()
                    .collect(Collectors.toMap(Attendance::getDate, a -> a));

            if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
                boolean matches = recordMap.values().stream()
                        .anyMatch(a -> a.getStatus().name().equalsIgnoreCase(status));
                if (!matches)
                    continue;
            }

            exportData.add(Map.entry(emp, recordMap));
        }

        return buildAttendanceWorkbook(exportData, from, to);
    }

    // ===== EXPORT: single employee, date range =====
    @Transactional(readOnly = true)
    public byte[] exportEmployeeAttendanceRange(Long employeeId, LocalDate from, LocalDate to) {
        Employee emp = employeeService.findById(employeeId);
        List<Attendance> records = attendanceRepo.findByEmployeeAndDateRangeOrderByDate(emp, from, to);
        Map<LocalDate, Attendance> recordMap = records.stream()
                .collect(Collectors.toMap(Attendance::getDate, a -> a));
        return buildAttendanceWorkbook(List.of(Map.entry(emp, recordMap)), from, to);
    }

    private byte[] buildAttendanceWorkbook(List<Map.Entry<Employee, Map<LocalDate, Attendance>>> data,
            LocalDate from, LocalDate to) {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Attendance");

            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_80_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            Map<AttendanceStatus, CellStyle> statusStyles = new java.util.HashMap<>();
            statusStyles.put(AttendanceStatus.PRESENT, coloredStyle(wb, IndexedColors.LIGHT_GREEN));
            statusStyles.put(AttendanceStatus.HALF_DAY, coloredStyle(wb, IndexedColors.LIGHT_ORANGE));
            statusStyles.put(AttendanceStatus.ABSENT, coloredStyle(wb, IndexedColors.ROSE));
            statusStyles.put(AttendanceStatus.ON_LEAVE, coloredStyle(wb, IndexedColors.PALE_BLUE));
            CellStyle weekendStyle = coloredStyle(wb, IndexedColors.GREY_25_PERCENT);

            List<LocalDate> days = new ArrayList<>();
            for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1))
                days.add(d);

            List<String> headers = new ArrayList<>(
                    List.of("Name", "Employee ID", "Department", "Role", "Employment status"));
            for (LocalDate d : days)
                headers.add(d.toString());
            headers.addAll(List.of("Total hours", "Present", "Half day", "Absent", "Leave", "Late arrivals"));

            CellStyle titleStyle = wb.createCellStyle();
            Font titleFont = wb.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle subtitleStyle = wb.createCellStyle();
            Font subtitleFont = wb.createFont();
            subtitleFont.setBold(true);
            subtitleStyle.setFont(subtitleFont);
            subtitleStyle.setAlignment(HorizontalAlignment.CENTER);

            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Attendance Report");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, headers.size() - 1));

            Row subtitleRow = sheet.createRow(1);
            Cell subtitleCell = subtitleRow.createCell(0);
            subtitleCell.setCellValue("From Date: " + from.toString() + "    To Date: " + to.toString());
            subtitleCell.setCellStyle(subtitleStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(1, 1, 0, headers.size() - 1));

            Row headerRow = sheet.createRow(2);
            for (int i = 0; i < headers.size(); i++) {
                Cell c = headerRow.createCell(i);
                c.setCellValue(headers.get(i));
                c.setCellStyle(headerStyle);
            }

            int rowIdx = 3;
            for (Map.Entry<Employee, Map<LocalDate, Attendance>> entry : data) {
                Employee emp = entry.getKey();
                Map<LocalDate, Attendance> recordMap = entry.getValue();
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(emp.getFirstName() + " " + emp.getLastName());
                row.createCell(1).setCellValue(emp.getEmployeeId());
                row.createCell(2).setCellValue(emp.getDepartment() != null ? emp.getDepartment() : "N/A");
                row.createCell(3).setCellValue(emp.getDesignation() != null ? emp.getDesignation() : "N/A");
                row.createCell(4).setCellValue(emp.isActive() ? "Active" : "Inactive");

                int present = 0, half = 0, absent = 0, leave = 0, late = 0;
                double totalHours = 0;
                int col = 5;

                for (LocalDate d : days) {
                    Cell cell = row.createCell(col++);
                    boolean weekend = d.getDayOfWeek() == DayOfWeek.SATURDAY || d.getDayOfWeek() == DayOfWeek.SUNDAY;
                    Attendance att = recordMap.get(d);

                    if (weekend) {
                        cell.setCellValue("WK");
                        cell.setCellStyle(weekendStyle);
                        continue;
                    }
                    if (att == null) {
                        cell.setCellValue("A");
                        cell.setCellStyle(statusStyles.get(AttendanceStatus.ABSENT));
                        absent++;
                        continue;
                    }

                    AttendanceStatus st = att.getStatus();
                    String label = switch (st) {
                        case PRESENT -> "P (" + fmt(att.getCheckIn()) + "-" + fmt(att.getCheckOut()) + ")";
                        case HALF_DAY -> "H (" + fmt(att.getCheckIn()) + "-" + fmt(att.getCheckOut()) + ")";
                        case ON_LEAVE -> "L";
                        default -> "A";
                    };
                    cell.setCellValue(label);
                    if (statusStyles.containsKey(st))
                        cell.setCellStyle(statusStyles.get(st));

                    if (st == AttendanceStatus.PRESENT)
                        present++;
                    else if (st == AttendanceStatus.HALF_DAY)
                        half++;
                    else if (st == AttendanceStatus.ON_LEAVE)
                        leave++;
                    else if (st == AttendanceStatus.ABSENT)
                        absent++;

                    if (att.getWorkHours() != null)
                        totalHours += att.getWorkHours();
                    if (att.getCheckIn() != null && att.getCheckIn().isAfter(LATE_THRESHOLD))
                        late++;
                }

                row.createCell(col++).setCellValue(Math.round(totalHours * 100.0) / 100.0);
                row.createCell(col++).setCellValue(present);
                row.createCell(col++).setCellValue(half);
                row.createCell(col++).setCellValue(absent);
                row.createCell(col++).setCellValue(leave);
                row.createCell(col).setCellValue(late);
            }

            for (int i = 0; i < headers.size(); i++)
                sheet.autoSizeColumn(i);

            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private CellStyle coloredStyle(XSSFWorkbook wb, IndexedColors color) {
        CellStyle style = wb.createCellStyle();
        style.setFillForegroundColor(color.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private String fmt(LocalTime t) {
        return t == null ? "--" : t.toString().substring(0, 5);
    }

    private List<AttendanceDTOs.DailyRecord> buildWeeklyRecords(Employee emp, LocalDate weekStart, LocalDate weekEnd,
            List<Attendance> records) {
        Map<LocalDate, Attendance> recordMap = records.stream()
                .collect(Collectors.toMap(Attendance::getDate, a -> a));

        List<AttendanceDTOs.DailyRecord> dailyRecords = new ArrayList<>();
        for (LocalDate date = weekStart; !date.isAfter(weekEnd); date = date.plusDays(1)) {
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

    private AttendanceDTOs.MonthlyStats calculateMonthlyStats(List<Attendance> records, LocalDate monthStart,
            LocalDate monthEnd) {
        AttendanceDTOs.MonthlyStats stats = new AttendanceDTOs.MonthlyStats();

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