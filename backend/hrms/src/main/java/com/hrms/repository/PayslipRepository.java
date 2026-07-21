package com.hrms.repository;

import com.hrms.entity.Payslip;
import com.hrms.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PayslipRepository extends JpaRepository<Payslip, Long> {
    Page<Payslip> findByEmployee(Employee employee, Pageable pageable);
    Optional<Payslip> findByPayslipNumber(String payslipNumber);
    boolean existsByPayroll_Id(Long payrollId);
}
