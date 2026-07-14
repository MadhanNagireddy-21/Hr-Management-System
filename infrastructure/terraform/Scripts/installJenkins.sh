#!/bin/bash
set -e

echo "=========================================================="
echo "Starting Jenkins & Docker CI/CD Installation..."
echo "=========================================================="

# Update system packages
echo "[1/6] Updating system packages..."
sudo dnf update -y

# Install essential CI build tools (Git, Maven, Java 17)
echo "[2/6] Installing Java 17 Corretto, Git, and Maven..."
sudo dnf install -y java-17-amazon-corretto git maven

# Add Jenkins official RedHat repository & key
echo "[3/6] Configuring official Jenkins RedHat repository..."
sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key

# Install Jenkins
echo "[4/6] Installing Jenkins server..."
sudo dnf install -y jenkins

# Install Docker for building container images inside Jenkins CI pipelines
echo "[5/6] Installing Docker and configuring Jenkins user permissions..."
sudo dnf install -y docker
sudo systemctl enable docker
sudo systemctl start docker

# Add Jenkins user to Docker group so Jenkins pipelines can run `docker build` without sudo
sudo usermod -aG docker jenkins

# Enable & start Jenkins service
echo "[6/6] Enabling and starting Jenkins service..."
sudo systemctl enable jenkins
sudo systemctl start jenkins

# Check system status
echo "Checking Jenkins status..."
sudo systemctl status jenkins --no-pager || true

echo "=========================================================="
echo "Jenkins & Docker installation completed successfully!"
echo "Initial Admin Password can be found at: /var/lib/jenkins/secrets/initialAdminPassword"
echo "=========================================================="
