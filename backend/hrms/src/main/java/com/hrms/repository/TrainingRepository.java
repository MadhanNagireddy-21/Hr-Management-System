package com.hrms.repository;

import com.hrms.entity.Training;
import com.hrms.entity.Training.TrainingStatus;
import com.hrms.entity.TrainingEnrollment;
import com.hrms.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TrainingRepository extends JpaRepository<Training, Long> {
    Page<Training> findByStatus(TrainingStatus status, Pageable pageable);
    Page<Training> findByCategory(String category, Pageable pageable);
}

