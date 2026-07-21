# 🖥️ HR Management System — Frontend (`hrms-web`)

A modern, responsive, and intuitive web portal built with **Next.js 16 (App Router)**, **React 19**, **Redux Toolkit**, and **Tailwind CSS v4** for the Enterprise HR Management System (HRMS).

---

## ✨ Features & Portals

The frontend is divided into dedicated portals tailored for administrators, HR managers, and employees:

### 👑 Admin & HR Portal (`/admin/*`)
* **📊 Analytics Dashboard:** Comprehensive overview of total headcount, attendance metrics, pending leave requests, and payroll summaries.
* **👥 Employee Management:** Full CRUD operations for employee profiles, department assignment, and role management.
* **💼 Recruitment & ATS:** Track open job postings, applicants, and candidate interview workflows.
* **🌱 Onboarding & Training:** Manage new hire onboarding checklists and training/development programs.
* **🏖️ Leave & Attendance:** Approve/reject leave requests and monitor real-time attendance logs.
* **📈 Performance Reviews:** Conduct employee evaluations and track KPI progression.
* **💰 Payroll & Compensation:** Review salary structures and manage payslip distribution.
* **⚙️ System Settings:** Configure organizational preferences, notifications, and security policies.

### 🧑‍💼 Employee Portal (`/employee/*`)
* **🏠 Self-Service Dashboard:** Personal attendance summary, upcoming holidays, and quick actions.
* **⏱️ Attendance Tracking:** Clock in / clock out and view historical attendance records.
* **🏖️ Leave Requests:** Submit vacation/sick leave applications and check real-time approval status.
* **🎯 Goals & Performance:** View personal appraisals and self-assessments.
* **📄 Payslip Access:** Securely view and download monthly payslip statements.

---

## 🛠️ Technology Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) | Modern React framework utilizing App Router (`output: export` for static HTML/JS) |
| **Edge Hosting** | [AWS CloudFront + S3](https://aws.amazon.com/) | Global edge delivery via CDN (`https://d2cloh163xljkh.cloudfront.net`) with `$0/mo` static hosting |
| **API Reverse Proxy** | [CloudFront `/api/*`](https://aws.amazon.com/) | Eliminates CORS & Mixed Content errors by proxying HTTPS `/api/*` requests directly to EC2 Nginx |
| **UI Library** | [React 19](https://react.dev/) | Core UI rendering engine |
| **State Management**| [Redux Toolkit](https://redux-toolkit.js.org/) | Global authentication and application state (`src/store/`) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first styling with responsive design & dark/light aesthetics |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, consistent vector iconography |
| **HTTP Client** | [Axios](https://axios-http.com/) | Interceptor-configured API client (`src/lib/axios.js`) |
| **Notifications** | [React Hot Toast](https://react-hot-toast.com/) | Lightweight and responsive toast alerts |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js:** v20.0.0 or higher
* **Backend API:** Ensure the Spring Boot backend (`http://localhost:8080`) is running locally or via Docker.

### 1️⃣ Local Development Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in Browser:**
   Visit **[http://localhost:3000](http://localhost:3000)** to access the login portal.

---

## 🔑 Pre-Seeded Test Credentials

Log in using any of the default accounts seeded by the backend:

| Role | Email | Password | Portal Access |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@hrms.com` | `Admin@123` | Admin Portal (`/admin/dashboard`) |
| **HR Manager** | `hr@hrms.com` | `Hr@12345` | Admin Portal (`/admin/dashboard`) |
| **Employee** | `emp@hrms.com` | `Emp@12345` | Employee Portal (`/employee/dashboard`) |

---

## 🐳 Docker Containerization

The project includes a production-ready **multi-stage Dockerfile** that optimizes build size and follows security best practices (non-root `nextjs` user in Next.js standalone mode).

### Build and Run with Docker

1. **Build the Docker image:**
   ```bash
   docker build -t frontend:v1 .
   ```

2. **Run the container locally on port 3000:**
   ```bash
   docker run -p 3000:3000 frontend:v1
   ```

3. **Access the application:**
   Open **[http://localhost:3000](http://localhost:3000)** in your browser.

> **Note:** When running via `docker-compose` from the root workspace (`docker-compose up -d`), the frontend automatically runs alongside the Spring Boot backend and database.

---

## 🗂️ Project Directory Breakdown

```
src/
├── app/
│   ├── page.js               # Login Portal & Authentication screen
│   ├── forgot-password/      # Password recovery workflow
│   ├── admin/                # Admin Portal pages & sub-routes
│   └── employee/             # Employee Self-Service pages & sub-routes
├── components/               # Reusable UI widgets, navigation bars, & modals
├── lib/                      # Axios API interceptor & endpoint definitions
└── store/                    # Redux store (`authSlice.js`)
```

