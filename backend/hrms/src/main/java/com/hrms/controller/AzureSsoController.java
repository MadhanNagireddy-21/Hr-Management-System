package com.hrms.controller;

import com.hrms.dto.ApiResponse;
import com.hrms.dto.AuthDTOs;
import com.hrms.entity.Employee;
import com.hrms.enums.Role;
import com.hrms.repository.EmployeeRepository;
import com.hrms.security.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/auth/azure")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Azure SSO login")
public class AzureSsoController {

    private final EmployeeRepository employeeRepository;
    private final JwtUtil jwtUtil;

    /**
     * Called automatically after Azure AD redirects back to your app.
     * If user exists in DB → return JWT token.
     * If user is new → auto-create as EMPLOYEE role.
     */
    @GetMapping("/callback")
    @Operation(summary = "Azure SSO callback — returns JWT after Microsoft login")
    public ResponseEntity<ApiResponse<AuthDTOs.AuthResponse>> azureCallback(
            OAuth2AuthenticationToken authentication) {

        OAuth2User principal = authentication.getPrincipal();

        // Extract fields from Azure token
        String azureOid = principal.getAttribute("oid");       // Azure Object ID (unique per user)
        String email    = principal.getAttribute("preferred_username");
        String name     = principal.getAttribute("name");
        String firstName = name != null && name.contains(" ")
                           ? name.split(" ")[0] : name;
        String lastName  = name != null && name.contains(" ")
                           ? name.substring(name.indexOf(" ") + 1) : "";

        // Find or create employee
        Employee employee = employeeRepository.findByAzureOid(azureOid)
                .orElseGet(() -> employeeRepository.findByEmail(email)
                        .orElseGet(() -> createEmployeeFromAzure(azureOid, email, firstName, lastName)));

        // Sync Azure OID if missing
        if (employee.getAzureOid() == null) {
            employee.setAzureOid(azureOid);
            employeeRepository.save(employee);
        }

        // Build JWT response
        AuthDTOs.AuthResponse response = new AuthDTOs.AuthResponse();
        response.setAccessToken(jwtUtil.generateToken(employee));
        response.setRefreshToken(jwtUtil.generateRefreshToken(employee));
        response.setRole(employee.getRole().name());
        response.setEmployeeId(employee.getId());
        response.setEmployeeCode(employee.getEmployeeId());
        response.setName(employee.getFirstName() + " " + employee.getLastName());
        response.setEmail(employee.getEmail());
        response.setExpiresIn(jwtUtil.getExpiration());

        return ResponseEntity.ok(ApiResponse.success("Azure SSO login successful", response));
    }

    private Employee createEmployeeFromAzure(String azureOid, String email,
                                              String firstName, String lastName) {
        long count = employeeRepository.count() + 1;
        String empId = "EMP" + String.format("%04d", count);

        Employee emp = Employee.builder()
                .employeeId(empId)
                .azureOid(azureOid)
                .email(email)
                .firstName(firstName != null ? firstName : "User")
                .lastName(lastName != null ? lastName : "")
                .password("")           // SSO users have no local password
                .role(Role.EMPLOYEE)    // Default role — Admin can change later
                .dateOfJoining(LocalDate.now())
                .active(true)
                .build();

        return employeeRepository.save(emp);
    }
}
