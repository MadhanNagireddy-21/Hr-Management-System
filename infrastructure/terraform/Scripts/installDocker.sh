#!/bin/bash
set -e

echo "=========================================================="
echo "Starting Docker Installation on Amazon Linux 2023 / RHEL..."
echo "=========================================================="

# Update system packages
echo "[1/5] Updating package index..."
sudo dnf update -y

# Install Docker
echo "[2/5] Installing Docker engine and dependencies..."
sudo dnf install -y docker

# Enable and start Docker service
echo "[3/5] Enabling and starting Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

# Add users to docker group so docker commands can run without sudo
echo "[4/5] Adding users to 'docker' group..."
if id "ec2-user" &>/dev/null; then
    sudo usermod -aG docker ec2-user
    echo "Added ec2-user to docker group."
fi

if id "jenkins" &>/dev/null; then
    sudo usermod -aG docker jenkins
    echo "Added jenkins user to docker group."
fi

# Verify installation
echo "[5/5] Verifying Docker installation..."
docker --version
sudo docker info | grep -E 'Server Version|Storage Driver|Kernel Version|Operating System' || true

echo "=========================================================="
echo "Docker installation completed successfully!"
echo "NOTE: Log out and log back in (or run 'newgrp docker') to apply group membership changes."
echo "=========================================================="
