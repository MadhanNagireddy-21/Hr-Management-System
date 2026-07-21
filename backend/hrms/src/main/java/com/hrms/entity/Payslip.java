package com.hrms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payslips")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Payslip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_id", nullable = false, unique = true)
    private Payroll payroll;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    private int month;
    private int year;

    // Earnings breakdown (copied from payroll for immutable record)
    @Column(precision = 12, scale = 2) private BigDecimal basicSalary;
    @Column(precision = 12, scale = 2) private BigDecimal hra;
    @Column(precision = 12, scale = 2) private BigDecimal da;
    @Column(precision = 12, scale = 2) private BigDecimal specialAllowance;
    @Column(precision = 12, scale = 2) private BigDecimal grossSalary;

    // Deductions
    @Column(precision = 12, scale = 2) private BigDecimal pf;
    @Column(precision = 12, scale = 2) private BigDecimal esi;
    @Column(precision = 12, scale = 2) private BigDecimal pt;
    @Column(precision = 12, scale = 2) private BigDecimal tds;
    @Column(precision = 12, scale = 2) private BigDecimal totalDeductions;
    @Column(precision = 12, scale = 2) private BigDecimal netSalary;

    private double presentDays;
    private int lopDays;
    private LocalDate payDate;

    // Unique payslip reference number e.g. PS-2024-12-EMP0003
    @Column(unique = true)
    private String payslipNumber;

    private LocalDateTime generatedAt;

    @PrePersist
    protected void onCreate() { generatedAt = LocalDateTime.now(); }
}
