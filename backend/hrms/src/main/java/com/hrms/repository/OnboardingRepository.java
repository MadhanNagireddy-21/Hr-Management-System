package com.hrms.repository;

import com.hrms.entity.Employee;
import com.hrms.entity.Onboarding;
import com.hrms.entity.Onboarding.OnboardingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface OnboardingRepository extends JpaRepository<Onboarding, Long> {
    Optional<Onboarding> findByEmployee(Employee employee);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"employee", "assignedHr"})
    Page<Onboarding> findAll(Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"employee", "assignedHr"})
    Page<Onboarding> findByStatus(OnboardingStatus status, Pageable pageable);
}
