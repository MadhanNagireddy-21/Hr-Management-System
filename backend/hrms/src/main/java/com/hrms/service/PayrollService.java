package com.hrms.service;

import com.hrms.dto.PayrollDTOs;
import com.hrms.entity.Employee;
import com.hrms.entity.Payroll;
import com.hrms.repository.AttendanceRepository;
import com.hrms.repository.PayrollRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class PayrollService {

    private final PayrollRepository payrollRepo;
    private final EmployeeService employeeService;
    private final AttendanceRepository attendanceRepo;

    @Transactional
    public PayrollDTOs.Response generatePayroll(PayrollDTOs.GenerateRequest req) {
        Employee emp = employeeService.findById(req.getEmployeeId());

        if (payrollRepo.findByEmployeeAndMonthAndYear(emp, req.getMonth(), req.getYear()).isPresent()) {
            throw new IllegalStateException("Payroll already generated for this month/year");
        }

        BigDecimal basic = emp.getBasicSalary();

        YearMonth ym = YearMonth.of(req.getYear(), req.getMonth());
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();
        long fullDays = attendanceRepo.countByEmployeeAndDateBetweenAndStatus(emp, from, to, com.hrms.enums.AttendanceStatus.PRESENT);
        long halfDays = attendanceRepo.countByEmployeeAndDateBetweenAndStatus(emp, from, to, com.hrms.enums.AttendanceStatus.HALF_DAY);
        double presentDays = fullDays + (halfDays * 0.5);
        int workingDaysInMonth = countWorkingDays(from, to);
        int lopDays = Math.max(0, workingDaysInMonth - (int) Math.ceil(presentDays));

        BigDecimal proRatedBasic = basic.multiply(BigDecimal.valueOf(presentDays))
                .divide(BigDecimal.valueOf(workingDaysInMonth), 2, RoundingMode.HALF_UP);

        BigDecimal hra            = proRatedBasic.multiply(new BigDecimal("0.40")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal da             = proRatedBasic.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal specialAllow   = proRatedBasic.multiply(new BigDecimal("0.20")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal grossSalary    = proRatedBasic.add(hra).add(da).add(specialAllow);

        BigDecimal pf    = proRatedBasic.multiply(new BigDecimal("0.12")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal esi   = grossSalary.compareTo(new BigDecimal("21000")) <= 0
                ? grossSalary.multiply(new BigDecimal("0.0075")).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal pt    = calculateProfessionalTax(grossSalary);
        BigDecimal tds   = BigDecimal.ZERO;

        BigDecimal totalDeductions = pf.add(esi).add(pt).add(tds);
        BigDecimal netSalary       = grossSalary.subtract(totalDeductions);

        Payroll payroll = Payroll.builder()
                .employee(emp)
                .month(req.getMonth())
                .year(req.getYear())
                .basicSalary(proRatedBasic)
                .hra(hra)
                .da(da)
                .specialAllowance(specialAllow)
                .grossSalary(grossSalary)
                .pf(pf)
                .esi(esi)
                .pt(pt)
                .tds(tds)
                .totalDeductions(totalDeductions)
                .netSalary(netSalary)
                .presentDays(presentDays)
                .lopDays(lopDays)
                .paid(false)
                .build();

        return toResponse(payrollRepo.save(payroll));
    }

    @Transactional(readOnly = true)
    public Page<PayrollDTOs.Response> getMyPayroll(Long employeeId, Pageable pageable) {
        Employee emp = employeeService.findById(employeeId);
        return payrollRepo.findByEmployee(emp, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<PayrollDTOs.Response> getMonthlyPayroll(int month, int year) {
        return payrollRepo.findByMonthAndYear(month, year).stream().map(this::toResponse).toList();
    }

    @Transactional
    public PayrollDTOs.Response markAsPaid(Long payrollId) {
        Payroll p = payrollRepo.findById(payrollId)
                .orElseThrow(() -> new NoSuchElementException("Payroll record not found"));
        p.setPaid(true);
        p.setPayDate(LocalDate.now());
        return toResponse(payrollRepo.save(p));
    }

    private BigDecimal calculateProfessionalTax(BigDecimal grossMonthly) {
        double gross = grossMonthly.doubleValue();
        if (gross <= 15000) return BigDecimal.ZERO;
        if (gross <= 20000) return new BigDecimal("150");
        return new BigDecimal("200");
    }

    private int countWorkingDays(LocalDate from, LocalDate to) {
        int days = 0;
        LocalDate date = from;
        while (!date.isAfter(to)) {
            java.time.DayOfWeek dow = date.getDayOfWeek();
            if (dow != java.time.DayOfWeek.SATURDAY && dow != java.time.DayOfWeek.SUNDAY) days++;
            date = date.plusDays(1);
        }
        return days;
    }

    private PayrollDTOs.Response toResponse(Payroll p) {
        PayrollDTOs.Response r = new PayrollDTOs.Response();
        r.setId(p.getId());
        r.setEmployeeDbId(p.getEmployee().getId());
        r.setEmployeeName(p.getEmployee().getFirstName() + " " + p.getEmployee().getLastName());
        r.setEmployeeCode(p.getEmployee().getEmployeeId());
        r.setMonth(p.getMonth());
        r.setYear(p.getYear());
        r.setBasicSalary(p.getBasicSalary());
        r.setHra(p.getHra());
        r.setDa(p.getDa());
        r.setSpecialAllowance(p.getSpecialAllowance());
        r.setGrossSalary(p.getGrossSalary());
        r.setPf(p.getPf());
        r.setEsi(p.getEsi());
        r.setPt(p.getPt());
        r.setTds(p.getTds());
        r.setTotalDeductions(p.getTotalDeductions());
        r.setNetSalary(p.getNetSalary());
        r.setPresentDays(p.getPresentDays());
        r.setLopDays(p.getLopDays());
        r.setPaid(p.isPaid());
        r.setPayDate(p.getPayDate());
        return r;
    }
}