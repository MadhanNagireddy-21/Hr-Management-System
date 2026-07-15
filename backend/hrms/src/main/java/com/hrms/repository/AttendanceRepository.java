package com.hrms.repository;

import com.hrms.entity.Attendance;
import com.hrms.entity.Employee;
import com.hrms.enums.AttendanceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByEmployeeAndDate(Employee employee, LocalDate date);
    Optional<Attendance> findFirstByEmployeeAndCheckOutIsNullOrderByDateDesc(Employee employee);
    List<Attendance> findByEmployeeAndDateBetween(Employee employee, LocalDate from, LocalDate to);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"employee"})
    Page<Attendance> findByEmployee(Employee employee, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"employee"})
    Page<Attendance> findByDate(LocalDate date, Pageable pageable);

    long countByEmployeeAndDateBetweenAndStatus(Employee employee, LocalDate from, LocalDate to, AttendanceStatus status);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.employee = :emp " +
           "AND a.date >= :from AND a.date <= :to AND a.status IN ('PRESENT','HALF_DAY')")
    long countPresentDays(Employee emp, LocalDate from, LocalDate to);
}
