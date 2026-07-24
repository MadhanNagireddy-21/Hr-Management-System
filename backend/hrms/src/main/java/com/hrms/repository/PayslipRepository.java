package com.hrms.repository;

import com.hrms.entity.Employee;
import com.hrms.entity.Payslip;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface PayslipRepository extends JpaRepository<Payslip, Long> {
    boolean existsByPayroll_Id(Long payrollId);

    Page<Payslip> findByEmployee(Employee employee, Pageable pageable);

    @Query("SELECT p FROM Payslip p " +
            "JOIN FETCH p.employee " +
            "LEFT JOIN FETCH p.payroll " +
            "WHERE p.payslipNumber = :payslipNumber")
    Optional<Payslip> findByPayslipNumber(String payslipNumber);
}