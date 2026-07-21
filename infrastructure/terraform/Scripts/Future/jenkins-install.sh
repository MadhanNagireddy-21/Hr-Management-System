#!/bin/bash
set -e

# Update system packages
dnf update -y

# Install essential CI build tools (Git, Maven, Java 17)
dnf install -y java-17-amazon-corretto git maven

# Add Jenkins official RedHat repository & key
wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key

# Install Jenkins
dnf install -y jenkins

# Install Docker for building container images inside Jenkins CI pipeline
dnf install -y docker
systemctl enable docker
systemctl start docker

# Add Jenkins user to Docker group so Jenkins pipelines can run `docker build` without sudo
usermod -aG docker jenkins

# Enable & start Jenkins service
systemctl enable jenkins
systemctl start jenkins

echo "Jenkins & Docker installation completed successfully."
