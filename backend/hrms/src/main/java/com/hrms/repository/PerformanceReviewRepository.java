package com.hrms.repository;

import com.hrms.entity.Employee;
import com.hrms.entity.PerformanceReview;
import com.hrms.entity.PerformanceReview.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PerformanceReviewRepository extends JpaRepository<PerformanceReview, Long> {
    Page<PerformanceReview> findByEmployee(Employee employee, Pageable pageable);
    Page<PerformanceReview> findByReviewer(Employee reviewer, Pageable pageable);
    Page<PerformanceReview> findByStatus(ReviewStatus status, Pageable pageable);
    List<PerformanceReview> findByEmployeeAndReviewPeriod(Employee employee, String reviewPeriod);
}
