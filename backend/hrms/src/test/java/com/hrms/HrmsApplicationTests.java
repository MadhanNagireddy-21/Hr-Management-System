package com.hrms;

import com.hrms.dto.AuthDTOs;
import com.hrms.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class HrmsApplicationTests {

    @Autowired
    private AuthService authService;

    @Test
    void contextLoads() {
        assertThat(authService).isNotNull();
    }

    @Test
    void adminLoginTest() {
        AuthDTOs.LoginRequest req = new AuthDTOs.LoginRequest();
        req.setEmail("admin@hrms.com");
        req.setPassword("Admin@123");
        req.setLoginType("ADMIN");

        AuthDTOs.AuthResponse response = authService.login(req);

        assertThat(response.getAccessToken()).isNotBlank();
        assertThat(response.getRole()).isEqualTo("ADMIN");
    }

    @Test
    void employeeLoginTest() {
        AuthDTOs.LoginRequest req = new AuthDTOs.LoginRequest();
        req.setEmail("emp@hrms.com");
        req.setPassword("Emp@12345");
        req.setLoginType("EMPLOYEE");

        AuthDTOs.AuthResponse response = authService.login(req);

        assertThat(response.getAccessToken()).isNotBlank();
        assertThat(response.getRole()).isEqualTo("EMPLOYEE");
    }
}
