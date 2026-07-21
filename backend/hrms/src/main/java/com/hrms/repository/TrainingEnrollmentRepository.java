package com.hrms.repository;

import com.hrms.entity.Employee;
import com.hrms.entity.Training;
import com.hrms.entity.TrainingEnrollment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TrainingEnrollmentRepository extends JpaRepository<TrainingEnrollment, Long> {
    Optional<TrainingEnrollment> findByTrainingAndEmployee(Training training, Employee employee);
    List<TrainingEnrollment> findByTraining(Training training);
    Page<TrainingEnrollment> findByEmployee(Employee employee, Pageable pageable);
    boolean existsByTrainingAndEmployee(Training training, Employee employee);
}
