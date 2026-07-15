package com.hrms.service;

import com.hrms.exception.EmployeeAlreadyExists;
import com.hrms.dto.EmployeeDTOs;
import com.hrms.entity.Employee;
import com.hrms.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.NoSuchElementException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.NoSuchElementException;
import java.util.List;
import java.util.stream.Collectors;
import com.hrms.enums.Role;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private UserCacheService userCacheService;

    @Transactional
    @CacheEvict(value = "dashboardData", allEntries = true)
    public EmployeeDTOs.Response createEmployee(EmployeeDTOs.CreateRequest req) {
        if (employeeRepository.existsByEmail(req.getEmail())) {
            throw new EmployeeAlreadyExists(req.getEmail());
        }
        Employee emp = Employee.builder()
                .employeeId(generateEmployeeId())
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .phone(req.getPhone())
                .department(req.getDepartment())
                .designation(req.getDesignation())
                .basicSalary(req.getBasicSalary())
                .dateOfJoining(req.getDateOfJoining() != null ? req.getDateOfJoining() : LocalDate.now())
                .dateOfBirth(req.getDateOfBirth())
                .role(req.getRole())
                .active(true)
                .build();
        return toResponse(employeeRepository.save(emp));
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @Cacheable("dashboardData")
    public Page<EmployeeDTOs.Response> getAllEmployees(Pageable pageable) {
        return employeeRepository.findAll(pageable).map(this::toResponse);
    }


    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public EmployeeDTOs.Response getById(Long id) {
        return toResponse(findById(id));
    }

    @Transactional
    @CacheEvict(value = "dashboardData", allEntries = true)
    public EmployeeDTOs.Response updateEmployee(Long id, EmployeeDTOs.UpdateRequest req) {
        Employee emp = findById(id);
        if (req.getFirstName() != null)    emp.setFirstName(req.getFirstName());
        if (req.getLastName() != null)     emp.setLastName(req.getLastName());
        if (req.getPhone() != null)        emp.setPhone(req.getPhone());
        if (req.getDepartment() != null)   emp.setDepartment(req.getDepartment());
        if (req.getDesignation() != null)  emp.setDesignation(req.getDesignation());
        if (req.getBasicSalary() != null)  emp.setBasicSalary(req.getBasicSalary());
        if (req.getDateOfBirth() != null)  emp.setDateOfBirth(req.getDateOfBirth());
        if (req.getRole() != null)         emp.setRole(req.getRole());
        if (req.getActive() != null)       emp.setActive(req.getActive());
        return toResponse(employeeRepository.save(emp));
    }


    @Transactional
    @CacheEvict(value = "dashboardData", allEntries = true)
    public void deactivateEmployee(Long id) {
        Employee emp = findById(id);
        emp.setActive(false);
        employeeRepository.save(emp);
        if (userCacheService != null && emp.getEmail() != null) {
            userCacheService.evict(emp.getEmail());
        }
    }

    @Transactional
    @CacheEvict(value = "dashboardData", allEntries = true)
    public void deleteEmployee(Long id) {
        Employee emp = findById(id);
        if (userCacheService != null && emp.getEmail() != null) {
            userCacheService.evict(emp.getEmail());
        }
        String[] childQueries = {
            "DELETE FROM Attendance a WHERE a.employee.id = :id",
            "DELETE FROM LeaveRequest l WHERE l.employee.id = :id",
            "DELETE FROM LeaveBalance l WHERE l.employee.id = :id",
            "DELETE FROM Payroll p WHERE p.employee.id = :id",
            "DELETE FROM Payslip p WHERE p.employee.id = :id",
            "DELETE FROM PerformanceReview p WHERE p.employee.id = :id OR p.reviewer.id = :id",
            "DELETE FROM Notification n WHERE n.recipient.id = :id",
            "DELETE FROM Onboarding o WHERE o.employee.id = :id",
            "DELETE FROM TrainingEnrollment t WHERE t.employee.id = :id"
        };
        for (String q : childQueries) {
            try {
                if (entityManager != null) {
                    entityManager.createQuery(q).setParameter("id", id).executeUpdate();
                }
            } catch (Exception e) {
                // Ignore if child entity is not found
            }
        }
        employeeRepository.delete(emp);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public Page<EmployeeDTOs.Response> search(String q, Pageable pageable) {
        return employeeRepository.search(q, pageable).map(this::toResponse);
    }
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<EmployeeDTOs.Response> getManagers() {
        return employeeRepository.findAll()
                .stream()
                .filter(e -> e.isActive() &&
                        (e.getRole() == Role.ADMIN || e.getRole() == Role.HR))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ---- helpers ----
    public Employee findById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Employee not found: " + id));
    }

    private String generateEmployeeId() {
        long count = employeeRepository.count() + 1;
        return "EMP" + String.format("%04d", count);
    }

    public EmployeeDTOs.Response toResponse(Employee e) {
        EmployeeDTOs.Response r = new EmployeeDTOs.Response();
        r.setId(e.getId());
        r.setEmployeeId(e.getEmployeeId());
        r.setFirstName(e.getFirstName());
        r.setLastName(e.getLastName());
        r.setFullName(e.getFirstName() + " " + e.getLastName());
        r.setEmail(e.getEmail());
        r.setPhone(e.getPhone());
        r.setDepartment(e.getDepartment());
        r.setDesignation(e.getDesignation());
        r.setBasicSalary(e.getBasicSalary());
        r.setDateOfJoining(e.getDateOfJoining());
        r.setDateOfBirth(e.getDateOfBirth());
        r.setRole(e.getRole());
        r.setActive(e.isActive());
        r.setCreatedAt(e.getCreatedAt());
        return r;
    }

}