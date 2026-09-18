package com.hrms.repository;

import com.hrms.entity.Employee;
import com.hrms.entity.Training;
import com.hrms.entity.TrainingEnrollment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TrainingEnrollmentRepository
        extends JpaRepository<TrainingEnrollment, Long> {

    // =========================================================
    // FIND EMPLOYEE TRAININGS
    // =========================================================

    Page<TrainingEnrollment> findByEmployee(
            Employee employee,
            Pageable pageable);

    // =========================================================
    // FIND TRAINING ENROLLMENTS
    // =========================================================

    List<TrainingEnrollment> findByTraining(
            Training training);

    // =========================================================
    // CHECK DUPLICATE ENROLLMENT
    // =========================================================

    boolean existsByTrainingAndEmployee(
            Training training,
            Employee employee);
}