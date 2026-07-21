# 🏢 HRMS Backend — Spring Boot 3.2.5 + TiDB Cloud Serverless MySQL / H2

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Backend Engine | Spring Boot 3.2.5, Java 17 (`Eclipse Temurin JRE`) |
| Production Database | TiDB Cloud Serverless MySQL 8.0 Cluster (`$0/mo Free Tier` / SSL Verified) |
| Local Database | Containerized MySQL 8.0 & H2 Embedded Database (`local` profile) |
| Reverse Proxy & CORS | Nginx Alpine (`docker-compose.prod.yml`) proxied via CloudFront Edge (`/api/*`) |
| Authentication & Security | Spring Security + JWT (`JJWT` 256-bit HS256) |
| API Documentation | Swagger UI (SpringDoc OpenAPI 3) |
| Build Tool | Maven 3.9.x |

---

## 🗂 Project Structure
```
hrms/
├── pom.xml
└── src/main/java/com/hrms/
    ├── HrmsApplication.java
    ├── config/
    │   ├── SecurityConfig.java
    │   ├── SwaggerConfig.java
    │   └── DataSeeder.java
    ├── controller/
    │   ├── AuthController.java
    │   ├── EmployeeController.java
    │   ├── AttendanceController.java
    │   ├── LeaveController.java
    │   ├── PayrollController.java
    │   ├── PayslipController.java
    │   ├── PerformanceController.java
    │   ├── TrainingController.java
    │   ├── RecruitmentController.java
    │   ├── OnboardingController.java
    │   ├── NotificationController.java
    │   ├── FileUploadController.java
    │   └── AzureSsoController.java
    ├── service/impl/
    │   ├── AuthService.java
    │   ├── EmployeeService.java
    │   ├── AttendanceService.java
    │   ├── LeaveService.java
    │   ├── LeaveBalanceService.java
    │   ├── PayrollService.java
    │   ├── PayslipService.java
    │   ├── PerformanceService.java
    │   ├── TrainingService.java
    │   ├── RecruitmentService.java
    │   ├── OnboardingService.java
    │   └── NotificationService.java
    ├── entity/
    │   ├── Employee.java
    │   ├── Attendance.java
    │   ├── LeaveRequest.java
    │   ├── LeaveBalance.java
    │   ├── Payroll.java
    │   ├── Payslip.java
    │   ├── PerformanceReview.java
    │   ├── Training.java
    │   ├── TrainingEnrollment.java
    │   ├── JobPosting.java
    │   ├── JobApplication.java
    │   ├── Onboarding.java
    │   └── Notification.java
    ├── repository/
    ├── dto/
    ├── enums/
    │   ├── Role.java
    │   ├── LeaveStatus.java
    │   └── AttendanceStatus.java
    ├── security/
    │   ├── JwtUtil.java
    │   └── JwtAuthFilter.java
    └── exception/
        └── GlobalExceptionHandler.java
```

---

## ⚙️ Setup & Running Instructions

The project supports **multiple execution profiles** so it can run instantly on a local laptop without external dependencies, while remaining 100% ready for AWS production deployment.

---

### Option A: Run Locally (H2 Embedded Database — Zero Setup)
By default, `application.properties` activates `spring.profiles.active=local`. This uses an H2 embedded database running in **MySQL compatibility mode (`MODE=MySQL`)** and saves data directly to `./data/hrms_db` inside the project folder.

1. **Open Terminal** inside `backend/hrms`:
   ```bash
   cd backend/hrms
   ```
2. **Start the application:**
   ```bash
   mvn spring-boot:run
   ```
3. **Access Swagger UI & API:**
   - URL: `http://localhost:8080/swagger-ui.html`
   - H2 Console (optional): `http://localhost:8080/h2-console` (`JDBC URL: jdbc:h2:file:./data/hrms_db`, User: `sa`, Password: empty)

---

### Option B: Run with MySQL (Local or Docker)
To use a real MySQL server instead of H2:

1. **Update `application.properties`:**
   Comment out or remove `spring.profiles.active=local`:
   ```properties
   # spring.profiles.active=local
   ```
2. **Setup MySQL (`localhost:3306`):**
   - **Using Windows MySQL Service:**
     ```sql
     CREATE DATABASE hrms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
     ```
   - **OR using Docker in one command:**
     ```bash
     docker run --name hrms-mysql -p 3306:3306 -e MYSQL_DATABASE=hrms_db -e MYSQL_ROOT_PASSWORD=${DB_PASSWORD:-change_me_in_env} -d mysql:8.0
     ```
3. **Run the project:**
   ```bash
   mvn spring-boot:run
   ```

---

### Option C: AWS Deployment (Docker / ECR / ECS + Amazon RDS)
The repository includes a multi-stage `Dockerfile` optimized for AWS container services (`Amazon ECS / Fargate`, `EKS`, or `EC2`).

#### 1. Build & Push Docker Image (`Amazon ECR`)
```bash
# Build production image locally
docker build -t hrms-backend .

# Tag & push to AWS ECR
docker tag hrms-backend:latest <aws-account-id>.dkr.ecr.<region>.amazonaws.com/hrms-backend:latest
docker push <aws-account-id>.dkr.ecr.<region>.amazonaws.com/hrms-backend:latest
```

#### 2. Configure AWS Environment Variables (ECS / EC2)
When running your container on AWS alongside an **Amazon RDS MySQL 8.0** database, inject the following environment variables (which automatically override local configurations):

| AWS Environment Variable | Value Example |
|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://hrms-db.cp5xyz.us-east-1.rds.amazonaws.com:3306/hrms_db?useSSL=true` |
| `SPRING_DATASOURCE_USERNAME` | Your RDS master username (e.g., `admin`) |
| `SPRING_DATASOURCE_PASSWORD` | Your RDS master password |
| `PORT` | `8080` |
| `JAVA_OPTS` | `-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0` |

---

## 🗂️ About Build Output (`target/` folder)
* When you compile (`mvn compile` or `mvn package`), Maven creates the `target/` directory containing `.class` files and the standalone executable `.jar`.
* Running `mvn clean` safely deletes the `target/` directory to ensure a fresh build.
* In Docker deployments (`Dockerfile:L32`), Stage 1 (`AS build`) generates `target/hrms-backend-*.jar`, and Stage 2 copies it into `app.jar` for the lightweight runtime image.

---

## 👤 Default Users (auto-seeded on first startup)

| Role | Email | Password | Login Portal |
|------|-------|----------|-------------|
| ADMIN | admin@hrms.com | Admin@123 | Admin/HR Login |
| HR | hr@hrms.com | Hr@12345 | Admin/HR Login |
| EMPLOYEE | emp@hrms.com | Emp@12345 | Employee Login |

---

## 🔐 Login Types (matches UI)

```
POST /api/auth/login
{
  "email": "admin@hrms.com",
  "password": "Admin@123",
  "loginType": "ADMIN"      ← use ADMIN for Admin/HR portal
}

{
  "email": "emp@hrms.com",
  "password": "Emp@12345",
  "loginType": "EMPLOYEE"   ← use EMPLOYEE for Employee portal
}
```

---

## 🔐 Role Permissions

| Endpoint | ADMIN | HR | EMPLOYEE |
|----------|:-----:|:--:|:--------:|
| Create/Update Employee | ✅ | ✅ | ❌ |
| Deactivate Employee | ✅ | ❌ | ❌ |
| View All Leaves | ✅ | ✅ | ❌ |
| Approve/Reject Leave | ✅ | ✅ | ❌ |
| Generate Payroll | ✅ | ✅ | ❌ |
| Mark Payroll Paid | ✅ | ❌ | ❌ |
| Generate Payslip | ✅ | ✅ | ❌ |
| Create Performance Review | ✅ | ✅ | ❌ |
| Acknowledge Own Review | ✅ | ✅ | ✅ |
| Create Training | ✅ | ✅ | ❌ |
| Enroll in Training | ✅ | ✅ | ✅ |
| Post Job | ✅ | ✅ | ❌ |
| Init Onboarding | ✅ | ✅ | ❌ |
| View Own Data | ✅ | ✅ | ✅ |

---

## 💰 Payroll Calculation (Indian)

| Component | Formula |
|-----------|---------|
| HRA | 40% of Basic |
| DA | 10% of Basic |
| Special Allowance | 20% of Basic |
| **Gross** | Basic + HRA + DA + Special |
| PF | 12% of Basic |
| ESI | 0.75% of Gross (if Gross ≤ ₹21,000) |
| PT | ₹0 / ₹150 / ₹200 by slab |
| **Net** | Gross − Deductions |

Pro-rated based on actual present days in the month.

---

## 🌐 All API Endpoints

### Auth
| Method | URL | Access |
|--------|-----|--------|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/refresh` | Public |

### Employees
| Method | URL | Access |
|--------|-----|--------|
| POST | `/api/employees` | Admin/HR |
| GET | `/api/employees` | Admin/HR |
| GET | `/api/employees/{id}` | All |
| PUT | `/api/employees/{id}` | Admin/HR |
| DELETE | `/api/employees/{id}` | Admin |
| GET | `/api/employees/search?q=` | Admin/HR |

### Attendance
| Method | URL | Access |
|--------|-----|--------|
| POST | `/api/attendance/check-in` | All |
| POST | `/api/attendance/check-out` | All |
| GET | `/api/attendance/my` | All |
| GET | `/api/attendance/date/{date}` | Admin/HR |

### Leave Management
| Method | URL | Access |
|--------|-----|--------|
| POST | `/api/leaves/apply` | All |
| GET | `/api/leaves/my` | All |
| GET | `/api/leaves/balance` | All |
| GET | `/api/leaves` | Admin/HR |
| GET | `/api/leaves/pending` | Admin/HR |
| GET | `/api/leaves/pending-cancellations` | Admin/HR |
| PUT | `/api/leaves/{id}/manager-action` | All |
| PUT | `/api/leaves/{id}/hr-action` | Admin/HR |
| PUT | `/api/leaves/{id}/cancel` | All (own) |
| PUT | `/api/leaves/{id}/cancel-action` | Admin/HR |

### Leave Cancellation Workflow
```
Leave PENDING/HR_PENDING  →  /cancel  →  instantly CANCELLED
Leave APPROVED            →  /cancel  →  CANCELLATION_PENDING
                          →  /cancel-action (HR) →  CANCELLED + balance restored
                                                 →  APPROVED (denied)
```

### Payroll
| Method | URL | Access |
|--------|-----|--------|
| POST | `/api/payroll/generate` | Admin/HR |
| GET | `/api/payroll/my` | All |
| GET | `/api/payroll/month?month=&year=` | Admin/HR |
| PUT | `/api/payroll/{id}/mark-paid` | Admin |

### Payslips
| Method | URL | Access |
|--------|-----|--------|
| POST | `/api/payslips/generate/{payrollId}` | Admin/HR |
| GET | `/api/payslips/my` | All |
| GET | `/api/payslips/{payslipNumber}` | All |

### Performance & Training
| Method | URL | Access |
|--------|-----|--------|
| POST | `/api/performance` | Admin/HR |
| PUT | `/api/performance/{id}` | Admin/HR |
| PUT | `/api/performance/{id}/acknowledge` | All (own) |
| GET | `/api/performance/my` | All |
| GET | `/api/performance` | Admin/HR |
| GET | `/api/performance/{id}` | Admin/HR |
| POST | `/api/trainings` | Admin/HR |
| PUT | `/api/trainings/{id}` | Admin/HR |
| GET | `/api/trainings` | All |
| GET | `/api/trainings/{id}` | All |
| POST | `/api/trainings/{id}/enroll` | All |
| PUT | `/api/trainings/enrollments/{id}/complete` | Admin/HR |
| GET | `/api/trainings/my` | All |

### Recruitment & Onboarding
| Method | URL | Access |
|--------|-----|--------|
| POST | `/api/recruitment/jobs` | Admin/HR |
| PUT | `/api/recruitment/jobs/{id}` | Admin/HR |
| GET | `/api/recruitment/jobs` | Public |
| GET | `/api/recruitment/jobs/all` | Admin/HR |
| POST | `/api/recruitment/jobs/{jobId}/apply` | Public |
| GET | `/api/recruitment/jobs/{jobId}/applications` | Admin/HR |
| PUT | `/api/recruitment/applications/{id}` | Admin/HR |
| POST | `/api/onboarding/init/{employeeId}` | Admin/HR |
| PUT | `/api/onboarding/{id}` | Admin/HR |
| GET | `/api/onboarding/employee/{employeeId}` | Admin/HR |
| GET | `/api/onboarding/my` | All |
| GET | `/api/onboarding` | Admin/HR |
| GET | `/api/onboarding/pending` | Admin/HR |

### Notifications
| Method | URL | Access |
|--------|-----|--------|
| GET | `/api/notifications` | All |
| GET | `/api/notifications/unread` | All |
| GET | `/api/notifications/unread-count` | All |
| PUT | `/api/notifications/{id}/read` | All |

### File Upload
| Method | URL | Access |
|--------|-----|--------|
| POST | `/api/files/upload` | Public |
| GET | `/api/files/download/{storedName}` | Public |

---

## 🗄️ Database Tables (13 total)

| Table | Purpose |
|-------|---------|
| employees | All users (Admin, HR, Employee) |
| attendance | Check-in/check-out records |
| leave_requests | Leave applications + approval stages |
| leave_balance | Annual leave quota tracking per employee |
| notifications | In-app notification feed |
| payroll | Monthly salary calculation |
| payslips | Permanent payslip records |
| performance_reviews | Employee performance ratings |
| trainings | Training programs |
| training_enrollments | Employee training participation |
| job_postings | Open job positions |
| job_applications | Candidate applications |
| onboarding | New employee onboarding checklist |

---

## 🧪 Postman Testing Flow

```
1.  Admin login                    → get Admin token
2.  Create employee (Hussain)      → get employee token
3.  Check in / Check out           → attendance recorded
4.  Apply leave (with managerId)   → MANAGER_PENDING
5.  Manager approves               → HR_PENDING
6.  HR approves                    → APPROVED, balance deducted
7.  Cancel leave (if APPROVED)     → CANCELLATION_PENDING
8.  HR confirms cancellation       → CANCELLED, balance restored
9.  Upload file                    → get file URL
10. Generate payroll               → salary calculated
11. Mark payroll paid              → payDate set
12. Generate payslip               → payslipNumber created
13. Create performance review      → overallRating calculated
14. Employee acknowledges review   → ACKNOWLEDGED
15. Create training program        → UPCOMING
16. Employee enrolls               → ENROLLED
17. Mark training complete         → score + certificate
18. Post job                       → OPEN
19. Candidate applies              → APPLIED
20. HR updates application         → SHORTLISTED → INTERVIEWED → OFFER_SENT
21. Init onboarding                → PENDING
22. Complete checklist             → COMPLETED (100%)
23. Check notifications            → all events logged
```