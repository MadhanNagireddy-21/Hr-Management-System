package com.hrms.repository;

import com.hrms.entity.Employee;
import com.hrms.entity.Payroll;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    Optional<Payroll> findByEmployeeAndMonthAndYear(Employee employee, int month, int year);

    List<Payroll> findByMonthAndYear(int month, int year);

    Page<Payroll> findByEmployee(Employee employee, Pageable pageable);

    @Query("SELECT SUM(p.netSalary) FROM Payroll p WHERE p.month=:month AND p.year=:year AND p.paid=true")
    BigDecimal totalPaidForMonth(int month, int year);
}