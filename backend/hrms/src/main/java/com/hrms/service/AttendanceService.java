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

import java.time.LocalDate;
import java.time.LocalTime;

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

        LocalTime checkIn = (req != null && req.getCheckIn() != null) ? req.getCheckIn() : LocalTime.now(istZone).withNano(0);

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

        LocalTime checkOut = (req != null && req.getCheckOut() != null) ? req.getCheckOut() : LocalTime.now(istZone).withNano(0);
        att.setCheckOut(checkOut);

        double hours = att.getCheckIn().until(checkOut, java.time.temporal.ChronoUnit.MINUTES) / 60.0;
        if (hours < 0) {
            hours += 24.0;
        }
        att.setWorkHours(Math.round(hours * 100.0) / 100.0);

        if (hours < 4) att.setStatus(AttendanceStatus.HALF_DAY);
        else att.setStatus(AttendanceStatus.PRESENT);

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