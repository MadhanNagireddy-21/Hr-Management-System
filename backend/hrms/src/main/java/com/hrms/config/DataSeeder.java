package com.hrms.config;

import com.hrms.entity.Employee;
import com.hrms.enums.Role;
import com.hrms.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${seed.admin.email:admin@hrms.com}")
    private String adminEmail;

    @Value("${seed.admin.password:Admin@123}")
    private String adminPassword;

    @Value("${seed.hr.email:hr@hrms.com}")
    private String hrEmail;

    @Value("${seed.hr.password:Hr@12345}")
    private String hrPassword;

    @Value("${seed.employee.email:emp@hrms.com}")
    private String empEmail;

    @Value("${seed.employee.password:Emp@12345}")
    private String empPassword;

    @Override
    public void run(String... args) {

        // Seed default Admin
        if (!employeeRepository.existsByEmail(adminEmail)) {
            Employee admin = Employee.builder()
                    .employeeId("EMP0001")
                    .firstName("System")
                    .lastName("Admin")
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .department("Administration")
                    .designation("System Administrator")
                    .role(Role.ADMIN)
                    .dateOfJoining(LocalDate.now())
                    .active(true)
                    .build();
            employeeRepository.save(admin);
            log.info("✅ ADMIN account seeded for email: {}  →  loginType: ADMIN", adminEmail);
        }

        // Seed default HR
        if (!employeeRepository.existsByEmail(hrEmail)) {
            Employee hr = Employee.builder()
                    .employeeId("EMP0002")
                    .firstName("HR")
                    .lastName("Manager")
                    .email(hrEmail)
                    .password(passwordEncoder.encode(hrPassword))
                    .department("Human Resources")
                    .designation("HR Manager")
                    .role(Role.HR)
                    .dateOfJoining(LocalDate.now())
                    .active(true)
                    .build();
            employeeRepository.save(hr);
            log.info("✅ HR account seeded for email: {}  →  loginType: HR", hrEmail);
        }

        // Seed default Employee
        if (!employeeRepository.existsByEmail(empEmail)) {
            Employee emp = Employee.builder()
                    .employeeId("EMP0003")
                    .firstName("Test")
                    .lastName("Employee")
                    .email(empEmail)
                    .password(passwordEncoder.encode(empPassword))
                    .department("Engineering")
                    .designation("Software Developer")
                    .role(Role.EMPLOYEE)
                    .dateOfJoining(LocalDate.now())
                    .active(true)
                    .build();
            employeeRepository.save(emp);
            log.info("✅ EMPLOYEE account seeded for email: {}  →  loginType: EMPLOYEE", empEmail);
        }
    }
}
