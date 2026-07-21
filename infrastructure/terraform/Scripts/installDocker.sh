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

# Install Docker Compose v2 CLI plugin & Buildx plugin
echo "[4/5] Installing Docker Compose v2 and Buildx plugins..."
sudo mkdir -p /usr/local/lib/docker/cli-plugins /usr/local/bin /usr/libexec/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
sudo ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
sudo ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/bin/docker-compose
sudo ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/libexec/docker/cli-plugins/docker-compose

sudo curl -SL https://github.com/docker/buildx/releases/download/v0.21.1/buildx-v0.21.1.linux-amd64 -o /usr/local/lib/docker/cli-plugins/docker-buildx
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx
sudo ln -sf /usr/local/lib/docker/cli-plugins/docker-buildx /usr/libexec/docker/cli-plugins/docker-buildx

# Add users to docker group so docker commands can run without sudo
echo "[5/5] Adding users to 'docker' group..."
if id "ec2-user" &>/dev/null; then
    sudo usermod -aG docker ec2-user
    echo "Added ec2-user to docker group."
fi

if id "jenkins" &>/dev/null; then
    sudo usermod -aG docker jenkins
    echo "Added jenkins user to docker group."
fi

# Verify installation
echo "Verifying Docker and Docker Compose installation..."
docker --version
docker compose version || /usr/local/bin/docker-compose version

echo "=========================================================="
echo "Docker installation completed successfully!"
echo "NOTE: Log out and log back in (or run 'newgrp docker') to apply group membership changes."
echo "=========================================================="
