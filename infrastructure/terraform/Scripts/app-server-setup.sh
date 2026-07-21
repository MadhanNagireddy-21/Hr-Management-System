#!/bin/bash
set -e

echo "=========================================================="
echo "Starting HRMS API Server Setup on Amazon Linux 2023..."
echo "=========================================================="

# Create application directory and environment secrets file
mkdir -p /opt/hrms
cat << EOF > /opt/hrms/.env
# --- Database & Spring Boot Configuration ---
SPRING_PROFILES_ACTIVE=default
SPRING_DATASOURCE_URL=${db_url}&useServerPrepStmts=false&serverTimezone=Asia/Kolkata
SPRING_DATASOURCE_USERNAME=${db_username}
SPRING_DATASOURCE_PASSWORD=${db_password}
SPRING_JPA_DATABASE_PLATFORM=${db_platform}
SPRING_DATASOURCE_DRIVER_CLASS_NAME=com.mysql.cj.jdbc.Driver
SHOW_SQL=false
BACKEND_PORT=8080
JAVA_OPTS=-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0

# --- JWT Authentication ---
JWT_SECRET=${jwt_secret}
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000

# --- Initial Data Seeder Configuration ---
SEED_ADMIN_EMAIL=admin@hrms.com
SEED_ADMIN_PASSWORD=Admin@123
SEED_HR_EMAIL=hr@hrms.com
SEED_HR_PASSWORD=Hr@12345
SEED_EMPLOYEE_EMAIL=emp@hrms.com
SEED_EMPLOYEE_PASSWORD=Emp@12345
EOF

chmod 600 /opt/hrms/.env
chown -R ec2-user:ec2-user /opt/hrms

# Install system dependencies (Git and Docker)
echo "Installing Git and Docker engine..."
dnf update -y
dnf install -y git docker

# Enable and start Docker service
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# Install Docker Compose v2 CLI plugin & Buildx plugin
echo "Installing Docker Compose v2 and Buildx..."
mkdir -p /usr/local/lib/docker/cli-plugins /usr/local/bin /usr/libexec/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/bin/docker-compose
ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/libexec/docker/cli-plugins/docker-compose

curl -SL https://github.com/docker/buildx/releases/download/v0.21.1/buildx-v0.21.1.linux-amd64 -o /usr/local/lib/docker/cli-plugins/docker-buildx
chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx
ln -sf /usr/local/lib/docker/cli-plugins/docker-buildx /usr/libexec/docker/cli-plugins/docker-buildx

echo "=========================================================="
echo "Setup completed! Docker, Compose, Git, and .env are ready at /opt/hrms/.env"
echo "=========================================================="
